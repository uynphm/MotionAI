import cv2
import mediapipe as mp
import numpy as np
import os
import speech_recognition as sr
import threading

# Initialize MediaPipe Pose and Hands
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands


import ssl
ssl._create_default_https_context = ssl._create_unverified_context

class PoseEstimationService:
    def __init__(self):
        print("Initializing MediaPipe models...")
        # static_image_mode=True is more robust for files where tracking might fail
        # model_complexity=1 is used to avoid downloading heavy models which may fail on some systems
        self.pose = mp_pose.Pose(
            static_image_mode=True, 
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.hands = mp_hands.Hands(
            static_image_mode=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Pre-warm the models with a dummy frame to speed up the first actual frame processing
        # This reduces the delay after the camera opens
        dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        self.pose.process(dummy_frame)
        self.hands.process(dummy_frame)
        print("Initialization complete.")

        self.keypoints_data = self.initialize_keypoints_data()
        self.frame_counter = 0
        self.is_running = True  # Flag to control the loop

        # Load existing file names to avoid conflicts
        self.existing_filenames = self.load_existing_filenames()

        # Set the output video file name
        self.video_file = self.generate_filename("user.avi")

        # Set the keypoints file name
        self.keypoints_file = self.generate_filename("user.txt")
    
    def load_existing_filenames(self):
        if os.path.exists("last_saved_filename.txt"):
            with open("last_saved_filename.txt", 'r') as f:
                return {line.strip() for line in f} # Use a set for fast look up
        return set()

    def generate_filename(self, base_filename):
        counter = 0
        original_base_filename = base_filename

        # Check if the base file name exists
        while base_filename in self.existing_filenames or os.path.exists(base_filename):
            base_name, extension = os.path.splitext(original_base_filename)
            counter += 1
            base_filename = f"{base_name}_{counter}{extension}"

        # Add the newly generated filename to the existing filenames set
        self.existing_filenames.add(base_filename)

        return base_filename

    def initialize_keypoints_data(self):
        return {
            "nose": [],
            "left_eye": [],
            "right_eye": [],
            "left_ear": [],
            "right_ear": [],
            "shoulder_left": [],
            "shoulder_right": [],
            "elbow_left": [],
            "elbow_right": [],
            "wrist_left": [],
            "wrist_right": [],
            "hip_left": [],
            "hip_right": [],
            "knee_left": [],
            "knee_right": [],
            "ankle_left": [],
            "ankle_right": [],
            "heel_left": [],
            "heel_right": [],
            "foot_index_left": [],
            "foot_index_right": [],
            "left_index_finger_tip": [], "right_index_finger_tip": [],
            "left_thumb_tip": [], "right_thumb_tip": []
        }

    def start_video_capture(self, video_source=0, is_live=True):
        self.is_live = is_live
        # Handle cases where video_source might be passed as a string representation of an integer
        if isinstance(video_source, str) and video_source.isdigit():
            video_source = int(video_source)
            self.is_live = True # Digit source is usually camera
            
        # If video_source is a file path, verify it exists before attempting to open
        if isinstance(video_source, str) and not os.path.exists(video_source):
             print(f"Error: Video file not found: {video_source}")
             print(f"Current working directory: {os.getcwd()}")
             print(f"Absolute path checked: {os.path.abspath(video_source)}")
             return

        cap = cv2.VideoCapture(video_source)
        if not cap.isOpened():
             print(f"Error opening video source: {video_source}")
             if isinstance(video_source, str):
                 print("Attempting to open with CAP_FFMPEG backend...")
                 cap = cv2.VideoCapture(video_source, cv2.CAP_FFMPEG)
                 if not cap.isOpened():
                     print("Failed to open with CAP_FFMPEG as well.")
                     return
             else:
                 return

        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if frame_width == 0 or frame_height == 0:
            print(f"Error: Could not retrieve frame dimensions for {video_source}. The file might be invalid or unsupported by the current OpenCV backend.")
            cap.release()
            return

        print(f"Processing video: {video_source} ({frame_width}x{frame_height}) - is_live={self.is_live}")

        if frame_width == 0 or frame_height == 0:
            print(f"Error: Could not retrieve frame dimensions for {video_source}. The file might be invalid or unsupported by the current OpenCV backend.")
            cap.release()
            return

        # Define the codec and create VideoWriter object
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(self.video_file, fourcc, 20.0, (frame_width, frame_height))

        detections_count = 0
        consecutive_no_detections = 0
        
        while cap.isOpened() and self.is_running:
            ret, frame = cap.read()
            if not ret:
                if self.frame_counter == 0:
                    print(f"Error: Failed to read the first frame from {video_source}. This usually indicates a codec issue or a corrupted file.")
                else:
                    print(f"\nVideo stream ended. Total frames: {self.frame_counter}, Frames with detections: {detections_count}")
                    if detections_count == 0:
                        print("WARNING: No pose landmarks were detected in the entire video. Check if the person is fully visible.")
                break
            
            # Ensure frame has 3 channels
            if frame.shape[2] == 4:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
                
            frame = cv2.resize(frame, (frame_width, frame_height))
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False

            # Pose detection
            results = self.pose.process(image)
            # Hand detection
            hand_results = self.hands.process(image)

            if results.pose_landmarks and self.frame_counter % 30 == 0:
                 print(f"Frame {self.frame_counter}: Detected pose landmarks but checking visibility...")

            frame_has_landmarks = False
            if results.pose_landmarks:
                # Draw pose landmarks on the image
                mp.solutions.drawing_utils.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                if self.extract_pose_keypoints(results.pose_landmarks.landmark):
                    frame_has_landmarks = True

            if hand_results.multi_hand_landmarks:
                for hand_index, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
                    # Determine if the hand is left or right
                    hand_label = hand_results.multi_handedness[hand_index].classification[0].label
                    hand_type = "left" if hand_label == "Left" else "right"

                    # Draw hand landmarks on image
                    mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    # Call extract_hand_keypoints
                    if self.extract_hand_keypoints(hand_landmarks, hand_type):
                        frame_has_landmarks = True
            
            if frame_has_landmarks:
                detections_count += 1
                consecutive_no_detections = 0
            else:
                consecutive_no_detections += 1

            # Write the frame to the output video file
            out.write(frame)

            # Display the frame only if live
            if self.is_live:
                cv2.imshow('Pose Estimation', frame)
                # ESC to exit
                if cv2.waitKey(1) & 0xFF == 27:
                    break
            else:
                if self.frame_counter % 30 == 0:
                    print(f"Processing frame {self.frame_counter}... (Detections so far: {detections_count})", end="\r", flush=True)
                
                # If we've seen many frames without detection in the middle of a file, log it once
                if consecutive_no_detections == 10 and detections_count > 0:
                     pass # Don't spam

            self.frame_counter += 1  # Increment the frame counter

        # Release resources
        cap.release()
        out.release()
        cv2.destroyAllWindows()

        self.save_keypoints_data()  # Save keypoints data to a text file

    def extract_pose_keypoints(self, landmarks):
    # Define keypoint mappings for pose landmarks
        keypoint_map = {
            mp_pose.PoseLandmark.NOSE.value: "nose",
            mp_pose.PoseLandmark.LEFT_EYE.value: "left_eye",
            mp_pose.PoseLandmark.RIGHT_EYE.value: "right_eye",
            mp_pose.PoseLandmark.LEFT_EAR.value: "left_ear",
            mp_pose.PoseLandmark.RIGHT_EAR.value: "right_ear",
            mp_pose.PoseLandmark.LEFT_SHOULDER.value: "shoulder_left",
            mp_pose.PoseLandmark.RIGHT_SHOULDER.value: "shoulder_right",
            mp_pose.PoseLandmark.LEFT_ELBOW.value: "elbow_left",
            mp_pose.PoseLandmark.RIGHT_ELBOW.value: "elbow_right",
            mp_pose.PoseLandmark.LEFT_WRIST.value: "wrist_left",
            mp_pose.PoseLandmark.RIGHT_WRIST.value: "wrist_right",
            mp_pose.PoseLandmark.LEFT_HIP.value: "hip_left",
            mp_pose.PoseLandmark.RIGHT_HIP.value: "hip_right",
            mp_pose.PoseLandmark.LEFT_KNEE.value: "knee_left",
            mp_pose.PoseLandmark.RIGHT_KNEE.value: "knee_right",
            mp_pose.PoseLandmark.LEFT_ANKLE.value: "ankle_left",
            mp_pose.PoseLandmark.RIGHT_ANKLE.value: "ankle_right",
            mp_pose.PoseLandmark.LEFT_HEEL.value: "heel_left",
            mp_pose.PoseLandmark.RIGHT_HEEL.value: "heel_right",
            mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value: "foot_index_left",
            mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value: "foot_index_right"
        }
        
        any_captured = False
        # Only capture and store keypoints if detected and visible
        for idx, key in keypoint_map.items():
            # Check if the landmark index exists and meets the visibility threshold
            if idx < len(landmarks) and landmarks[idx].visibility > 0.3:
                landmark = landmarks[idx]
                self.keypoints_data[key].append([self.frame_counter, landmark.x, landmark.y, landmark.z]) 
                any_captured = True
        return any_captured

    def extract_hand_keypoints(self, hand_landmarks, hand_type):
        # Define required landmarks with keys for both hands
        required_landmarks = {
            f"{hand_type}_index_finger_tip": mp.solutions.hands.HandLandmark.INDEX_FINGER_TIP,
            f"{hand_type}_thumb_tip": mp.solutions.hands.HandLandmark.THUMB_TIP,
        }

        any_captured = False
        for keypoint, landmark in required_landmarks.items():
            # Check if landmark index exists
            if landmark < len(hand_landmarks.landmark):
                x, y, z = hand_landmarks.landmark[landmark].x, hand_landmarks.landmark[landmark].y, hand_landmarks.landmark[landmark].z
                self.keypoints_data[keypoint].append([self.frame_counter, x, y, z])
                any_captured = True
        return any_captured

    def save_keypoints_data(self):
        # Save the keypoints data to a .txt file
        with open(self.keypoints_file, 'w') as f:
            for keypoint, positions in self.keypoints_data.items():
                if positions:
                    f.write(f"{keypoint}:\n")
                    for pos in positions:
                        f.write(f"  Frame {pos[0]}: x={pos[1]:.4f}, y={pos[2]:.4f}, z={pos[3]:.4f}\n")
                    f.write("\n")
        print(self.keypoints_file)
        
        # Append to the shared file if it exists, otherwise create and write
        mode = 'a' if os.path.exists("last_saved_filename.txt") else 'w'
        with open("last_saved_filename.txt", mode) as shared_file:
            shared_file.write(self.keypoints_file + '\n')
            
    def is_camera_available(self):
        cap = cv2.VideoCapture(0)  # Try to open the default camera (index 0)
        is_opened = cap.isOpened()  # Check if the camera is opened successfully
        cap.release()  # Release the camera
        return is_opened  # Return whether the camera is available
    
    def listen_for_stop_command(self):
        recognizer = sr.Recognizer()
        microphone = sr.Microphone()

        with microphone as source:
            recognizer.adjust_for_ambient_noise(source)
            while self.is_running:
                try:
                    audio = recognizer.listen(source, timeout=5)
                    command = recognizer.recognize_google(audio).lower()
                    if "stop" in command:
                        self.is_running = False
                        break
                except sr.UnknownValueError:
                    continue
                except sr.WaitTimeoutError:
                    continue
                except sr.RequestError as e:
                    print(f"Error: {e}")
                    break

if __name__ == "__main__":
    import sys
    
    # Start the video capture in Python
    pose_service = PoseEstimationService()

    # If the user provides a video file via command line argument, process it locally
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        # Check if video_path is a number (camera index) passed as a string
        if video_path.isdigit():
            print(f"Starting live camera: {video_path}")
            # Start voice recognition for live camera
            voice_thread = threading.Thread(target=pose_service.listen_for_stop_command)
            voice_thread.daemon = True
            voice_thread.start()
            pose_service.start_video_capture(video_path, is_live=True)
        else:
            print(f"Processing local file: {video_path}")
            pose_service.start_video_capture(video_path, is_live=False)
    else:
        # Start voice recognition in separate thread (Live Camera only)
        voice_thread = threading.Thread(target=pose_service.listen_for_stop_command)
        voice_thread.daemon = True
        voice_thread.start()

        # Check if camera is available before starting video capture
        if pose_service.is_camera_available():
            pose_service.start_video_capture()
        else:
            print("Camera not detected. Please connect a camera and try again.")

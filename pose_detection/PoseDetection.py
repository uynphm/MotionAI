import cv2
import mediapipe as mp
import numpy as np
import os
import threading
import time

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose

class PoseEstimationService:
    def __init__(self):
        print("Initializing MediaPipe models...")
        self.pose = mp_pose.Pose(
            static_image_mode=False, # Use False for better tracking in video
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        self.pose.process(dummy_frame)
        print("Initialization complete.")

        self.keypoints_data = self.initialize_keypoints_data()
        self.frame_counter = 0
        self.is_running = True
        self.is_recording = False
        self.current_frame = None
        self.lock = threading.Lock()
        
        # Initialize camera here to avoid NoneType errors in start_recording
        print("Opening camera...")
        self.cap = cv2.VideoCapture(0)
        self.out = None

        self.video_file = None
        self.keypoints_file = None
        
        # Also include Hands if user wants it
        self.hands = mp.solutions.hands.Hands()
        
        # Load existing file names
        self.existing_filenames = self.load_existing_filenames()

        # Start persistent capture thread
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()

    def load_existing_filenames(self):
        if os.path.exists("last_saved_filename.txt"):
            try:
                with open("last_saved_filename.txt", 'r') as f:
                    return {line.strip() for line in f if line.strip()}
            except:
                return set()
        return set()

    def generate_filename(self, base_filename):
        counter = 0
        original_name, extension = os.path.splitext(base_filename)
        current_name = base_filename

        while current_name in self.existing_filenames or os.path.exists(current_name):
            counter += 1
            current_name = f"{original_name}_{counter}{extension}"

        self.existing_filenames.add(current_name)
        return current_name

    def initialize_keypoints_data(self):
        return {
            "nose": [], "left_eye": [], "right_eye": [], "left_ear": [], "right_ear": [],
            "shoulder_left": [], "shoulder_right": [], "elbow_left": [], "elbow_right": [],
            "wrist_left": [], "wrist_right": [], "hip_left": [], "hip_right": [],
            "knee_left": [], "knee_right": [], "ankle_left": [], "ankle_right": [],
            "heel_left": [], "heel_right": [], "foot_index_left": [], "foot_index_right": [],
            "left_index_finger_tip": [], "right_index_finger_tip": [],
            "left_thumb_tip": [], "right_thumb_tip": []
        }

    def _capture_loop(self):
        """Persistent loop for camera capture and preview"""
        print("Starting camera capture thread...")
        
        while self.is_running:
            if self.cap is None or not self.cap.isOpened():
                print("Camera not open, attempting re-open...")
                self.cap = cv2.VideoCapture(0)
                time.sleep(1)
                continue

            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            # Process frame
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(image_rgb)
            hand_results = self.hands.process(image_rgb)
            
            # Draw landmarks on current frame (for preview)
            if results.pose_landmarks:
                mp.solutions.drawing_utils.draw_landmarks(
                    frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            
            if hand_results.multi_hand_landmarks:
                for hand_landmarks in hand_results.multi_hand_landmarks:
                    mp.solutions.drawing_utils.draw_landmarks(
                        frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS)

            # If recording, extract and save
            if self.is_recording:
                self.extract_pose_keypoints(results.pose_landmarks.landmark if results.pose_landmarks else None)
                if hand_results.multi_hand_landmarks:
                    for i, hands_lms in enumerate(hand_results.multi_hand_landmarks):
                        label = hand_results.multi_handedness[i].classification[0].label
                        self.extract_hand_keypoints(hands_lms, "left" if label == "Left" else "right")
                
                if self.out:
                    self.out.write(frame)
                self.frame_counter += 1

            # Update current frame for MJPEG stream
            with self.lock:
                self.current_frame = frame.copy()

        if self.cap:
            self.cap.release()

    def start_recording(self, filename_base="user"):
        self.video_file = self.generate_filename(f"{filename_base}.mp4")
        self.keypoints_file = self.generate_filename(f"{filename_base}.txt")
        self.keypoints_data = self.initialize_keypoints_data()
        self.frame_counter = 0
        
        # Initialize VideoWriter
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width == 0 or height == 0: width, height = 1280, 720
        
        # Use avc1 (H.264) for maximum browser compatibility (dashboards/web)
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        self.out = cv2.VideoWriter(self.video_file, fourcc, 20.0, (width, height))
        
        # If avc1 fails, fallback to mp4v but note it may have issues in Chrome
        if not self.out.isOpened():
            print("Warning: avc1 codec failed, falling back to mp4v")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.out = cv2.VideoWriter(self.video_file, fourcc, 20.0, (width, height))
        
        self.is_recording = True
        print(f"Recording started: {self.video_file}")

    def stop_recording(self):
        self.is_recording = False
        if self.out:
            self.out.release()
            self.out = None
        self.save_keypoints_data()
        print(f"Recording stopped: {self.keypoints_file}")

    def start_video_capture(self, video_source, is_live=False, output_base="user"):
        """Process video files (uploads or provided paths)"""
        if is_live: return # Handled by the persistent _capture_loop thread
        
        self.video_file = self.generate_filename(f"{output_base}.mp4")
        self.keypoints_file = self.generate_filename(f"{output_base}.txt")
        self.keypoints_data = self.initialize_keypoints_data()
        self.frame_counter = 0
        
        cap = cv2.VideoCapture(video_source)
        if not cap.isOpened():
            print(f"Error: Could not open video source {video_source}")
            return

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width <= 0 or height <= 0: width, height = 1280, 720

        # Use avc1 (H.264) for maximum browser compatibility (dashboards/web)
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        self.out = cv2.VideoWriter(self.video_file, fourcc, 20.0, (width, height))
        
        # If avc1 fails, fallback to mp4v
        if not self.out.isOpened():
            print("Warning: avc1 codec failed (possibly no h264 encoder/plugin), falling back to mp4v")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.out = cv2.VideoWriter(self.video_file, fourcc, 20.0, (width, height))

        # Use dedicated local models for file processing to avoid concurrency/timestamp issues
        # with the background camera thread.
        local_pose = mp_pose.Pose(static_image_mode=False, model_complexity=1)
        local_hands = mp.solutions.hands.Hands(static_image_mode=False)

        # Use blank frame approach if it's a Pro video to match user's logic
        is_pro = output_base.lower() == "pro"

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            # Create blank frame if processing Pro template
            if is_pro:
                draw_target = np.zeros((height, width, 3), dtype=np.uint8)
            else:
                draw_target = frame

            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = local_pose.process(img)
            h_res = local_hands.process(img)

            if res.pose_landmarks:
                mp.solutions.drawing_utils.draw_landmarks(
                    draw_target, res.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                self.extract_pose_keypoints(res.pose_landmarks.landmark)
            
            if h_res.multi_hand_landmarks:
                for i, h_lms in enumerate(h_res.multi_hand_landmarks):
                    mp.solutions.drawing_utils.draw_landmarks(
                        draw_target, h_lms, mp.solutions.hands.HAND_CONNECTIONS)
                    label = h_res.multi_handedness[i].classification[0].label
                    self.extract_hand_keypoints(h_lms, "left" if label == "Left" else "right")
            
            self.out.write(draw_target)
            self.frame_counter += 1
            
        cap.release()
        local_pose.close()
        local_hands.close()
        self.out.release()
        self.out = None
        self.save_keypoints_data()
        print(f"Processing complete: {self.keypoints_file}")

    def extract_pose_keypoints(self, landmarks):
        if not landmarks: return False
        
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
        for idx, key in keypoint_map.items():
            if idx < len(landmarks) and landmarks[idx].visibility > 0.5:
                landmark = landmarks[idx]
                self.keypoints_data[key].append([self.frame_counter, landmark.x, landmark.y, landmark.z]) 
                any_captured = True
        return any_captured

    def extract_hand_keypoints(self, hand_landmarks, hand_type):
        required_landmarks = {
            f"{hand_type}_index_finger_tip": mp.solutions.hands.HandLandmark.INDEX_FINGER_TIP,
            f"{hand_type}_thumb_tip": mp.solutions.hands.HandLandmark.THUMB_TIP,
        }
        for key, lm_idx in required_landmarks.items():
            if lm_idx < len(hand_landmarks.landmark):
                lm = hand_landmarks.landmark[lm_idx]
                self.keypoints_data[key].append([self.frame_counter, lm.x, lm.y, lm.z])

    def save_keypoints_data(self):
        with open(self.keypoints_file, 'w') as f:
            for keypoint, positions in self.keypoints_data.items():
                if positions:
                    f.write(f"{keypoint}:\n")
                    for pos in positions:
                        f.write(f"  Frame {pos[0]}: x={pos[1]:.4f}, y={pos[2]:.4f}, z={pos[3]:.4f}\n")
                    f.write("\n")
        
        mode = 'a' if os.path.exists("last_saved_filename.txt") else 'w'
        with open("last_saved_filename.txt", mode) as shared_file:
            shared_file.write(self.keypoints_file + '\n')

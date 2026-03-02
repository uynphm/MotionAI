import os

def read_keypoints_from_file(file_path):
    """
    Port of PoseDataReader.readKeypointsFromFile
    """
    keypoints_map = {}
    try:
        with open(file_path, 'r') as f:
            current_keypoint = None
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                if line.endswith(":"):
                    current_keypoint = line[:-1].strip()
                    keypoints_map[current_keypoint] = {}
                elif current_keypoint:
                    # Format: Frame 0: x=0.428, y=0.512, z=0.012
                    parts = line.split(":")
                    if len(parts) > 1:
                        frame_info = parts[0].strip()
                        # Extract "0" from "Frame 0"
                        try:
                            frame_number = int(frame_info.split(" ")[1])
                        except (IndexError, ValueError):
                            continue
                        
                        # Extract x, y, z
                        coords_str = parts[1].strip().split(",")
                        values = [0.0, 0.0, 0.0]
                        for i, coord in enumerate(coords_str):
                            if i < 3:
                                val_parts = coord.strip().split("=")
                                if len(val_parts) > 1:
                                    values[i] = float(val_parts[1])
                        
                        keypoints_map[current_keypoint][frame_number] = values
    except Exception as e:
        print(f"Error reading keypoints: {e}")
    return keypoints_map

def get_last_saved_filename(index_file="last_saved_filename.txt"):
    """
    Port of PoseDataReader.readLastSavedFileName
    """
    if not os.path.exists(index_file):
        return None
    try:
        with open(index_file, 'r') as f:
            lines = f.readlines()
            if lines:
                return lines[-1].strip()
    except Exception as e:
        print(f"Error reading last saved filename: {e}")
    return None

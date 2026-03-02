import math

def calculate_distance(p1, p2):
    """
    Euclidean distance between two 3D points
    """
    if p1 is None or p2 is None:
        return float('inf')
    return math.sqrt(
        (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2
    )

def dtw(user_part_data, pro_part_data):
    """
    Port of DynamicTimeWarping.dtw
    """
    user_keys = sorted(user_part_data.keys())
    pro_keys = sorted(pro_part_data.keys())
    
    n = len(user_keys)
    m = len(pro_keys)
    
    if n == 0 or m == 0:
        return float('inf')
        
    dtw_matrix = [[float('inf')] * (m + 1) for _ in range(n + 1)]
    dtw_matrix[0][0] = 0
    
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            user_coords = user_part_data[user_keys[i - 1]]
            pro_coords = pro_part_data[pro_keys[j - 1]]
            
            cost = calculate_distance(user_coords, pro_coords)
            
            dtw_matrix[i][j] = cost + min(
                dtw_matrix[i-1][j],      # Insertion
                dtw_matrix[i][j-1],      # Deletion
                dtw_matrix[i-1][j-1]     # Match
            )
            
    return dtw_matrix[n][m] / max(n, m)

def dtw_with_alignment_path(user_part_data, pro_part_data):
    """
    Port of DynamicTimeWarping.dtwWithAlignmentPath
    """
    user_keys = sorted(user_part_data.keys())
    pro_keys = sorted(pro_part_data.keys())
    
    n = len(user_keys)
    m = len(pro_keys)
    
    if n == 0 or m == 0:
        return []
        
    dtw_matrix = [[float('inf')] * (m + 1) for _ in range(n + 1)]
    path_matrix = [[0] * m for _ in range(n)]
    dtw_matrix[0][0] = 0
    
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            user_coords = user_part_data[user_keys[i - 1]]
            pro_coords = pro_part_data[pro_keys[j - 1]]
            
            cost = calculate_distance(user_coords, pro_coords)
            
            neighbors = [dtw_matrix[i-1][j], dtw_matrix[i][j-1], dtw_matrix[i-1][j-1]]
            min_cost = min(neighbors)
            dtw_matrix[i][j] = cost + min_cost
            
            if min_cost == dtw_matrix[i-1][j]:
                path_matrix[i-1][j-1] = 1 # Vertical
            elif min_cost == dtw_matrix[i][j-1]:
                path_matrix[i-1][j-1] = 2 # Horizontal
            else:
                path_matrix[i-1][j-1] = 3 # Diagonal
                
    alignment_path = []
    i, j = n - 1, m - 1
    while i >= 0 and j >= 0:
        alignment_path.append([user_keys[i], pro_keys[j]])
        if path_matrix[i][j] == 1:
            i -= 1
        elif path_matrix[i][j] == 2:
            j -= 1
        else:
            i -= 1
            j -= 1
            
    return alignment_path[::-1]

def calculate_score(similarity_score, max_similarity=1.5):
    """
    Port of PoseScoring.calculateScore
    """
    similarity_score = min(similarity_score, max_similarity)
    normalized = similarity_score / max_similarity
    return int(max(0, (1 - normalized) * 100))

def generate_comparison_prompt(user_keypoints, pro_keypoints, part_needed, threshold=80):
    """
    Port of PoseScoring.generateComparisonPrompt
    """
    if part_needed not in user_keypoints or not user_keypoints[part_needed]:
        return "no source"
    
    if part_needed not in pro_keypoints or not pro_keypoints[part_needed]:
        return "no source"
        
    user_part_data = user_keypoints[part_needed]
    pro_part_data = pro_keypoints[part_needed]
    
    alignment_path = dtw_with_alignment_path(user_part_data, pro_part_data)
    
    bad_frames = []
    
    for user_frame, pro_frame in alignment_path:
        user_coords = user_part_data[user_frame]
        pro_coords = pro_part_data[pro_frame]
        
        # Scoring this specific frame pair
        frame_dist = calculate_distance(user_coords, pro_coords)
        score = calculate_score(frame_dist)
        
        if score < threshold:
            bad_frames.append({
                "score": score,
                "user_frame": user_frame,
                "user_coords": user_coords,
                "pro_frame": pro_frame,
                "pro_coords": pro_coords
            })
    
    if not bad_frames:
        return ""
        
    # Sort by worst score (most deviation) and take top 15 to stay within token limits
    bad_frames.sort(key=lambda x: x["score"])
    selected_frames = bad_frames[:15]
    
    prompt = [f"Body Part: {part_needed}", "Major posture deviations found in the following frames:"]
    
    for frame in selected_frames:
        u_c = frame["user_coords"]
        p_c = frame["pro_coords"]
        prompt.append(f"User Frame {frame['user_frame']}: x={u_c[0]:.4f}, y={u_c[1]:.4f}, z={u_c[2]:.4f}")
        prompt.append(f"Pro Frame {frame['pro_frame']}: x={p_c[0]:.4f}, y={p_c[1]:.4f}, z={p_c[2]:.4f} (Score: {frame['score']})\n")
            
    return "\n".join(prompt)

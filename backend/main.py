from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import threading
import cv2
from typing import Optional
import sys
import time
import glob

# Add project root to path to import local modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pose_detection.PoseDetection import PoseEstimationService
from web_call.AI_Call import generate_feedback_api
from backend.reader import read_keypoints_from_file, get_last_saved_filename
from backend.process import generate_comparison_prompt, calculate_score

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instance
pose_service = None

def get_pose_service():
    global pose_service
    if pose_service is None:
        pose_service = PoseEstimationService()
    return pose_service

@app.get("/")
async def root():
    return {"status": "Motion AI Backend Running"}

@app.get("/video/user")
async def get_user_video():
    # Priority: Find most recent user*.mp4 (for browser) then user*.avi
    video_files = glob.glob("user*.mp4") + glob.glob("user*.avi")
    if video_files:
        latest_user_video = max(video_files, key=os.path.getmtime)
        return FileResponse(latest_user_video, media_type="video/mp4")
    
    # Fallback to uploads
    if os.path.exists("uploads"):
        up_files = glob.glob("uploads/*.mp4") + glob.glob("uploads/*.avi")
        if up_files:
            latest_up = max(up_files, key=os.path.getmtime)
            return FileResponse(latest_up, media_type="video/mp4")
            
    return {"error": "No user video found"}

@app.get("/video/pro")
async def get_pro_video():
    # Priority: Latest recorded/uploaded Pro benchmarking (mp4 then avi)
    pro_files = glob.glob("Pro*.mp4") + glob.glob("pro*.mp4") + \
                glob.glob("Pro*.avi") + glob.glob("pro*.avi")
    if pro_files:
        latest_pro = max(pro_files, key=os.path.getmtime)
        return FileResponse(latest_pro, media_type="video/mp4")
    
    # Fallback to default database video
    db_pro = "motion_database/jackhiphop/pro.avi"
    if os.path.exists(db_pro):
        return FileResponse(db_pro, media_type="video/mp4")
    
    return {"error": "Pro video reference not found"}

def gen_frames():
    service = get_pose_service()
    while True:
        if service.current_frame is not None:
            with service.lock:
                ret, buffer = cv2.imencode('.jpg', service.current_frame)
            if not ret:
                continue
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            time.sleep(0.1)

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(gen_frames(),
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/record/start")
async def start_recording(mode: str = "user"):
    service = get_pose_service()
    filename_base = "Pro" if mode == "pro" else "user"
    service.start_recording(filename_base=filename_base)
    return {"status": "Recording started", "file": service.video_file, "mode": mode}

@app.post("/record/stop")
async def stop_recording():
    service = get_pose_service()
    service.stop_recording()
    return {"status": "Stop command sent"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...), mode: str = Form("user")):
    upload_dir = "uploads"
    if not os.path.exists(upload_dir): os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    service = get_pose_service()
    output_base = "Pro" if mode == "pro" else "user"
    
    # Analyze synchronously to match JavaFX sequential logic and update frontend properly
    service.start_video_capture(file_path, False, output_base)
    
    return {
        "status": "Processing complete", 
        "video_file": service.video_file,
        "keypoints_file": service.keypoints_file,
        "mode": mode
    }

@app.post("/analyze")
async def analyze(body_part: str = Form(...)):
    # 1. Get latest USER data from history
    user_file = None
    if os.path.exists("last_saved_filename.txt"):
        with open("last_saved_filename.txt", 'r') as f:
            all_files = [line.strip() for line in f if line.strip()]
            # Filter specifically for 'user' files to avoid analyzing Pro vs Pro
            user_candidates = [f for f in all_files if f.lower().startswith("user")]
            if user_candidates:
                user_file = user_candidates[-1]
    
    if not user_file or not os.path.exists(user_file):
        return {"error": "No user performance data found. Please upload or record in USER mode first."}
    
    user_keypoints = read_keypoints_from_file(user_file)
    
    # 2. Get PRO data (Priority: custom Pro*.txt / pro*.txt -> default)
    pro_file = "motion_database/jackhiphop/pro.txt"
    pro_recordings = glob.glob("Pro*.txt") + glob.glob("pro*.txt")
    if pro_recordings:
        pro_file = max(pro_recordings, key=os.path.getmtime)
        
    if not os.path.exists(pro_file):
        return {"error": "Professional reference not found. Please upload or record a PRO benchmark."}
        
    pro_keypoints = read_keypoints_from_file(pro_file)
    
    # 3. Generate comparison
    prompt = generate_comparison_prompt(user_keypoints, pro_keypoints, body_part)
    if prompt == "no source": return {"error": "no source"}
    if prompt.startswith("ERROR:"): return {"error": prompt}
        
    # 4. Calculate score
    from backend.process import dtw, calculate_score
    user_part_data = user_keypoints.get(body_part, {})
    pro_part_data = pro_keypoints.get(body_part, {})
    similarity = dtw(user_part_data, pro_part_data)
    score = calculate_score(similarity)
    
    # 5. AI Insights
    ai_insights = generate_feedback_api(prompt)
    
    return {
        "score": score,
        "insights": ai_insights,
        "part": body_part,
        "prompt_debug": prompt[:200] + "..." if len(prompt) > 200 else prompt
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

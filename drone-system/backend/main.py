import os
import cv2
import pandas as pd
import httpx
import asyncio
import numpy as np
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from typing import List
from datetime import datetime

app = FastAPI()

UPLOAD_DIR = "backend/uploads"
FORWARD_URL = "http://localhost:3001/api/detections"

# Litter Detection parameters (from live-detect.py)
LOWER_LITTER = np.array([27, 3, 107])
UPPER_LITTER = np.array([98, 102, 255])
AREA_THRESHOLD = 10

def detect_litter_in_frame(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    blur = cv2.medianBlur(hsv, 11)
    mask = cv2.inRange(blur, LOWER_LITTER, UPPER_LITTER)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detections = []
    for contour in contours:
        if cv2.contourArea(contour) > AREA_THRESHOLD:
            x, y, w, h = cv2.boundingRect(contour)
            detections.append({"x": x, "y": y, "w": w, "h": h, "area": cv2.contourArea(contour)})
    return detections

async def forward_to_service(data):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(FORWARD_URL, json=data)
            print(f"Forwarded to {FORWARD_URL}: {response.status_code}")
        except Exception as e:
            print(f"Error forwarding to {FORWARD_URL}: {e}")

async def process_video_and_gps(video_path: str, gps_path: str):
    # Load GPS data
    try:
        gps_df = pd.read_csv(gps_path)
    except Exception as e:
        print(f"Error reading GPS: {e}")
        return

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0: fps = 30 # Default if not detectable

    frame_idx = 0
    all_detections = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Process every 5th frame for speed
        if frame_idx % 5 == 0:
            timestamp_sec = frame_idx / fps
            detections = detect_litter_in_frame(frame)
            
            if detections:
                # Find closest GPS entry
                # We assume 'seconds_since_start' in CSV matches video start
                closest_gps = gps_df.iloc[(gps_df['seconds_since_start'] - timestamp_sec).abs().argsort()[:1]]
                
                if not closest_gps.empty:
                    gps_info = closest_gps.iloc[0].to_dict()
                    detection_data = {
                        "timestamp": datetime.now().isoformat(),
                        "video_timestamp": timestamp_sec,
                        "latitude": gps_info['latitude'],
                        "longitude": gps_info['longitude'],
                        "altitude": gps_info['altitude'],
                        "detections": detections
                    }
                    all_detections.append(detection_data)
                    # Forward immediately or batch? Let's forward immediately for real-time feel
                    await forward_to_service(detection_data)

        frame_idx += 1
    
    cap.release()
    print(f"Finished processing. Found detections in {len(all_detections)} sampled frames.")

@app.post("/upload")
async def upload_data(background_tasks: BackgroundTasks, video: UploadFile = File(...), gps: UploadFile = File(...)):
    video_path = os.path.join(UPLOAD_DIR, video.filename)
    gps_path = os.path.join(UPLOAD_DIR, gps.filename)
    
    with open(video_path, "wb") as f:
        f.write(await video.read())
    
    with open(gps_path, "wb") as f:
        f.write(await gps.read())
        
    # Start processing in background
    background_tasks.add_task(process_video_and_gps, video_path, gps_path)
    
    return {"status": "success", "message": "Files uploaded and processing started."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

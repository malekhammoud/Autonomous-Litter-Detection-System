import os
import requests
import glob
import time

BACKEND_URL = "http://localhost:8000/upload" # Replace with actual IP if not localhost

VIDEO_DIR = "data/videos"
GPS_DIR = "data/gps_logs"

def get_latest_file(directory, extension):
    files = glob.glob(os.path.join(directory, f"*{extension}"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)

def upload_latest():
    video_file = get_latest_file(VIDEO_DIR, ".mp4")
    gps_file = get_latest_file(GPS_DIR, ".csv")

    if not video_file or not gps_file:
        print("Could not find latest video or GPS file.")
        return

    # Extract base names to ensure they match (e.g. drone_video_20250311_130219)
    video_name = os.path.basename(video_file).replace(".mp4", "")
    gps_name = os.path.basename(gps_file).replace("_gps.csv", "")

    if video_name != gps_name:
        print(f"Warning: Latest files might not match. Video: {video_name}, GPS: {gps_name}")
        # We'll upload anyway, but might want to be more careful

    print(f"Uploading {video_file} and {gps_file}...")

    with open(video_file, 'rb') as v, open(gps_file, 'rb') as g:
        files = {
            'video': (os.path.basename(video_file), v, 'video/mp4'),
            'gps': (os.path.basename(gps_file), g, 'text/csv')
        }
        try:
            response = requests.post(BACKEND_URL, files=files)
            if response.status_code == 200:
                print("Upload successful!")
                print(response.json())
            else:
                print(f"Upload failed with status code {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Error during upload: {e}")

if __name__ == "__main__":
    upload_latest()

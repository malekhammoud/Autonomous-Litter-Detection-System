import time
import os
import threading
from datetime import datetime
from picamera2 import Picamera2
from dronekit import connect, VehicleMode, Command, LocationGlobalRelative
import csv
import subprocess

# --- Configuration ---
MAVLINK_PORT = '/dev/ttyS0'
MAVLINK_BAUD = 57600
TARGET_ALTITUDE = 10
VIDEO_DIR = "data/videos"
GPS_DIR = "data/gps_logs"

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(GPS_DIR, exist_ok=True)

class MissionRunner:
    def __init__(self):
        print("Connecting to drone...")
        self.vehicle = connect(MAVLINK_PORT, baud=MAVLINK_BAUD, wait_ready=True)
        
        print("Initializing camera...")
        self.picam2 = Picamera2()
        self.camera_config = self.picam2.create_preview_configuration()
        self.picam2.configure(self.camera_config)
        
        self.recording = False
        self.gps_thread = None
        self.video_filename = ""
        self.gps_filename = ""
        self.start_time = None

    def log_gps_data(self):
        with open(self.gps_filename, 'w', newline='') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(['timestamp', 'seconds_since_start', 'latitude', 'longitude', 'altitude'])
            
            while self.recording:
                loc = self.vehicle.location.global_relative_frame
                current_time = datetime.now()
                seconds_since_start = (current_time - self.start_time).total_seconds()
                
                csv_writer.writerow([
                    current_time.isoformat(),
                    seconds_since_start,
                    loc.lat,
                    loc.lon,
                    loc.alt
                ])
                csvfile.flush()
                time.sleep(0.2) # Log at 5Hz

    def start_mission_recording(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.video_filename = os.path.join(VIDEO_DIR, f"mission_{timestamp}.mp4")
        self.gps_filename = os.path.join(GPS_DIR, f"mission_{timestamp}_gps.csv")
        
        print(f"Recording video to {self.video_filename}")
        self.picam2.start()
        self.picam2.start_and_record_video(self.video_filename)
        
        self.recording = True
        self.start_time = datetime.now()
        self.gps_thread = threading.Thread(target=self.log_gps_data)
        self.gps_thread.start()

    def stop_mission_recording(self):
        self.recording = False
        if self.gps_thread:
            self.gps_thread.join()
        self.picam2.stop_recording()
        self.picam2.stop()
        print("Recording stopped.")

    def arm_and_takeoff(self, alt):
        print("Arming motors")
        self.vehicle.mode = VehicleMode("GUIDED")
        self.vehicle.armed = True
        while not self.vehicle.armed:
            time.sleep(1)
        print("Taking off!")
        self.vehicle.simple_takeoff(alt)
        while self.vehicle.location.global_relative_frame.alt < alt * 0.95:
            time.sleep(1)
        print("Reached altitude")

    def run(self):
        try:
            self.arm_and_takeoff(TARGET_ALTITUDE)
            self.start_mission_recording()
            
            # Simple mission: fly forward for 10 seconds then land
            # (In a real scenario, you'd use waypoints like in full.py)
            print("Flying mission...")
            time.sleep(10) 
            
            print("Mission complete. Landing...")
            self.vehicle.mode = VehicleMode("LAND")
            
            # Wait until landed
            while self.vehicle.location.global_relative_frame.alt > 0.3:
                print(f"Landing... Alt: {self.vehicle.location.global_relative_frame.alt:.2f}")
                time.sleep(1)
            
            print("Landed safely.")
            self.stop_mission_recording()
            self.vehicle.close()

            # Trigger upload
            print("Triggering upload to backend...")
            subprocess.run(["python3", "scripts/upload_to_backend.py"])

        except Exception as e:
            print(f"Error during mission: {e}")
            self.stop_mission_recording()
            self.vehicle.close()

if __name__ == "__main__":
    runner = MissionRunner()
    runner.run()

import urllib.request
import json
import random
import time
import math
import argparse
import sys

# API Endpoint
API_URL = "http://localhost:3000/api/litter"

def parse_arguments():
    parser = argparse.ArgumentParser(description='Drone Litter Simulation')
    parser.add_argument('--lat', type=float, default=43.025886, help='Center Latitude (default: London, ON)')
    parser.add_argument('--lon', type=float, default=-81.296819, help='Center Longitude (default: London, ON)')
    parser.add_argument('--radius', type=float, default=0.02, help='Radius in km (default: 20m)')
    parser.add_argument('--interval', type=float, default=5.0, help='Interval in seconds')
    parser.add_argument('--url', type=str, default="http://localhost:3000/api/litter", help='API Endpoint URL')
    return parser.parse_args()

def generate_random_point(lat, lon, radius_km):
    # 1 degree lat ~ 111km
    r = (radius_km * math.sqrt(random.random())) / 111
    theta = random.random() * 2 * math.pi
    
    lat_offset = r * math.cos(theta)
    lon_offset = (r * math.sin(theta)) / math.cos(lat * math.pi / 180)
    
    return lat + lat_offset, lon + lon_offset

def report_litter(url, lat, lon):
    payload = {
        "latitude": lat,
        "longitude": lon
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            if response.status == 201:
                print(f"✅ Reported litter at {lat:.6f}, {lon:.6f}")
            else:
                print(f"❌ Failed to report: {response.status} - {response.read().decode('utf-8')}")
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    args = parse_arguments()
    
    print(f"🚁 Starting Drone Simulation...")
    print(f"📍 Center: {args.lat}, {args.lon}")
    print(f"📏 Radius: {args.radius} km")
    print(f"⏱️ Interval: {args.interval} seconds")
    print(f"📡 Sending data to {args.url}")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            # Generate new point around the center
            new_lat, new_lon = generate_random_point(args.lat, args.lon, args.radius)
            report_litter(args.url, new_lat, new_lon)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped")

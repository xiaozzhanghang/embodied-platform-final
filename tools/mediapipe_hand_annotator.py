#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google MediaPipe Hands 21-Joint Pose Extractor & Local Inference Server
Designed for Embodied AI Hand Keypoint Annotation on Apple Silicon Mac.
"""

import sys
import os
import json
import time
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Suppress noisy absl logs
os.environ['GLOG_minloglevel'] = '2'

try:
    import cv2
    import mediapipe as mp
except ImportError as e:
    print(f"Error importing dependencies: {e}", file=sys.stderr)
    print("Please run: pip3 install mediapipe opencv-python", file=sys.stderr)
    sys.exit(1)

# MediaPipe 21-point standard joint definitions matching frontend
KEYPOINT_NAMES = [
    "Wrist", "Thumb_CMC", "Thumb_MCP", "Thumb_IP", "Thumb_TIP",
    "Index_MCP", "Index_PIP", "Index_DIP", "Index_TIP",
    "Middle_MCP", "Middle_PIP", "Middle_DIP", "Middle_TIP",
    "Ring_MCP", "Ring_PIP", "Ring_DIP", "Ring_TIP",
    "Pinky_MCP", "Pinky_PIP", "Pinky_DIP", "Pinky_TIP"
]

def init_detector(static_mode=False, max_hands=2, min_detection_conf=0.25):
    mp_hands = mp.solutions.hands
    return mp_hands.Hands(
        static_image_mode=static_mode,
        max_num_hands=max_hands,
        min_detection_confidence=min_detection_conf,
        min_tracking_confidence=min_detection_conf
    )

def extract_frame_landmarks(detector, frame_bgr):
    """Process a single BGR frame and return structured hand data with Ego-centric handedness correction."""
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    results = detector.process(rgb)
    
    if not results.multi_hand_landmarks:
        return {}

    raw_hands = []
    for idx, hand_lms in enumerate(results.multi_hand_landmarks):
        score = float(results.multi_handedness[idx].classification[0].score)
        if score < 0.25:
            continue
        
        points = []
        for pt_id, lm in enumerate(hand_lms.landmark):
            points.append({
                "id": pt_id,
                "name": KEYPOINT_NAMES[pt_id],
                "x": round(float(lm.x), 4),
                "y": round(float(lm.y), 4),
                "z": round(float(lm.z), 4),
                "visibility": "visible" if getattr(lm, 'visibility', 1.0) > 0.5 else "occluded"
            })
            
        wrist_x = points[0]["x"]
        raw_hands.append({
            "score": round(score, 4),
            "points": points,
            "wrist_x": wrist_x,
        })
        
    if not raw_hands:
        return {}

    hands_data = {}
    if len(raw_hands) == 1:
        h = raw_hands[0]
        # In Ego-centric camera looking down at the workbench:
        # If wrist_x >= 0.48: it is the operator's right arm; else left arm
        hand_type = "right" if h["wrist_x"] >= 0.48 else "left"
        grasp = "power_grasp" if hand_type == "right" else "palm_press"
        hands_data[hand_type] = {
            "score": h["score"],
            "graspTaxonomy": grasp,
            "contactState": "in_contact",
            "points": h["points"]
        }
    else:
        # Two hands: sort by wrist_x (smaller is left, larger is right)
        raw_hands.sort(key=lambda item: item["wrist_x"])
        left_h = raw_hands[0]
        right_h = raw_hands[1]
        hands_data["left"] = {
            "score": left_h["score"],
            "graspTaxonomy": "finger_support",
            "contactState": "in_contact",
            "points": left_h["points"]
        }
        hands_data["right"] = {
            "score": right_h["score"],
            "graspTaxonomy": "power_grasp",
            "contactState": "in_contact",
            "points": right_h["points"]
        }
        
    return hands_data

def process_video(video_path, output_json=None, sample_step=10):
    """Extract hand poses from a video file and save/return structured JSON."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found at: {video_path}")
        
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"[*] Processing video: {video_path}")
    print(f"[*] Meta: {width}x{height}, {total_frames} frames @ {fps:.2f} FPS")
    
    detector = init_detector(static_mode=False, max_hands=2, min_detection_conf=0.25)
    
    keyframes_data = {}
    frame_idx = 0
    detected_count = 0
    start_time = time.time()
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        hands = extract_frame_landmarks(detector, frame)
        if hands:
            detected_count += 1
            if frame_idx % sample_step == 0:
                keyframes_data[str(frame_idx)] = hands
                
        frame_idx += 1
        
    cap.release()
    detector.close()
    
    total_time = time.time() - start_time
    result = {
        "model": "Google MediaPipe Hands 0.10.14",
        "device": "Apple Silicon (M1 Pro Metal / XNNPACK)",
        "video": os.path.basename(video_path),
        "total_frames": total_frames,
        "fps": fps,
        "sampled_frames_count": len(keyframes_data),
        "processing_time_sec": round(total_time, 2),
        "avg_frame_latency_ms": round((total_time / max(1, frame_idx)) * 1000, 2),
        "keyframes": keyframes_data
    }
    
    print(f"[+] Done in {total_time:.2f}s ({detected_count} frames with hands detected).")
    
    if output_json:
        os.makedirs(os.path.dirname(os.path.abspath(output_json)), exist_ok=True)
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"[+] Saved output to {output_json}")
        
    return result

class LocalPoseAPIHandler(BaseHTTPRequestHandler):
    detector = None

    @classmethod
    def get_detector(cls):
        if cls.detector is None:
            cls.detector = init_detector(static_mode=True, max_hands=2, min_detection_conf=0.25)
        return cls.detector

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if parsed.path == '/status' or parsed.path == '/':
            res = {
                "status": "online",
                "model": "Google MediaPipe Hands 0.10.14",
                "backend": "Local Apple M1 Pro (Metal + XNNPACK)",
                "capabilities": ["21_keypoints", "dual_hands", "3d_coordinates", "realtime"]
            }
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        else:
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if parsed.path == '/api/extract':
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                video_path = data.get('video_path', 'DM_20260814173416_001.mp4')
                step = int(data.get('step', 30))
                res = process_video(video_path, sample_step=step)
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server(port=8765):
    print(f"[*] Starting Local MediaPipe Hands Server on port {port}...")
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, LocalPoseAPIHandler)
    print(f"[+] Server ready at http://localhost:{port}/status")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server stopped.")
        httpd.server_close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="MediaPipe Hands Annotation Helper")
    parser.add_argument('--video', type=str, default='DM_20260814173416_001.mp4', help="Video file path")
    parser.add_argument('--output', type=str, default='public/mediapipe_hand_landmarks.json', help="Output JSON path")
    parser.add_argument('--step', type=int, default=30, help="Sampling frame step")
    parser.add_argument('--serve', action='store_true', help="Run as local HTTP API server")
    parser.add_argument('--port', type=int, default=8765, help="Port for local HTTP server")
    
    args = parser.parse_args()
    
    if args.serve:
        run_server(args.port)
    else:
        process_video(args.video, args.output, sample_step=args.step)

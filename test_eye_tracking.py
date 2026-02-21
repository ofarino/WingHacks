"""
Test script for eye tracking system
Run this to verify the setup works
"""

import sys
print("Testing eye tracking imports...")

try:
    import cv2
    print("✓ OpenCV imported successfully")
except ImportError as e:
    print(f"✗ OpenCV import failed: {e}")
    sys.exit(1)

try:
    import mediapipe as mp
    print("✓ MediaPipe imported successfully")
except ImportError as e:
    print(f"✗ MediaPipe import failed: {e}")
    sys.exit(1)

try:
    import numpy as np
    print("✓ NumPy imported successfully")
except ImportError as e:
    print(f"✗ NumPy import failed: {e}")
    sys.exit(1)

try:
    from vision.eyes import EyeTracker
    print("✓ EyeTracker module imported successfully")
except ImportError as e:
    print(f"✗ EyeTracker import failed: {e}")
    sys.exit(1)

try:
    from vision.presence import PresenceDetector
    print("✓ PresenceDetector module imported successfully")
except ImportError as e:
    print(f"✗ PresenceDetector import failed: {e}")
    sys.exit(1)

try:
    from vision.video_stream import VideoStream
    print("✓ VideoStream module imported successfully")
except ImportError as e:
    print(f"✗ VideoStream import failed: {e}")
    sys.exit(1)

print("\n✅ All modules imported successfully!")
print("\nEye Tracking System Ready!")
print("\nTo use:")
print("1. Start Flask app: python app.py")
print("2. Open Pomodoro page in browser")
print("3. Frontend should call: POST /api/eye-tracking/start")
print("4. Frontend polls: GET /api/eye-tracking/status (every 2-3 seconds)")
print("5. When alert_triggered=true, show visual/audio alert")
print("\nSee EYE_TRACKING_API.md for full documentation")

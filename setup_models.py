#!/usr/bin/env python3
"""
Download MediaPipe models for eye tracking and presence detection
"""

import os
import subprocess

# Create models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'vision', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Model URLs and filenames
MODELS = {
    'face_landmarker': {
        'url': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        'filename': 'face_landmarker.task'
    },
    'face_detector': {
        'url': 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        'filename': 'face_detector.tflite'
    }
}

def download_model(name, info):
    """Download a model file using curl"""
    filepath = os.path.join(MODELS_DIR, info['filename'])
    
    if os.path.exists(filepath):
        print(f"✓ {name} already exists: {filepath}")
        return True
    
    print(f"Downloading {name}...")
    try:
        # Use curl to download (works well on macOS)
        result = subprocess.run(
            ['curl', '-L', '-o', filepath, info['url']],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and os.path.exists(filepath):
            print(f"✓ Downloaded {name} to {filepath}")
            return True
        else:
            print(f"✗ Failed to download {name}")
            print(f"  You can manually download from: {info['url']}")
            return False
    except Exception as e:
        print(f"✗ Failed to download {name}: {e}")
        print(f"  You can manually download from: {info['url']}")
        return False

def main():
    print("Setting up MediaPipe models for eye tracking...")
    print(f"Models directory: {MODELS_DIR}\n")
    
    for name, info in MODELS.items():
        download_model(name, info)
    
    print("\n✓ Setup complete!")
    print(f"\nModel files are in: {MODELS_DIR}")

if __name__ == '__main__':
    main()

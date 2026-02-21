#!/usr/bin/env python3
"""
Download MediaPipe models for eye tracking and presence detection
Run this once before using the eye tracking feature!
"""

import os
import subprocess
import sys

# Create models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'vision', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Model URLs and filenames
MODELS = {
    'face_landmarker': {
        'url': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        'filename': 'face_landmarker.task',
        'description': 'Face Landmarker (for eye detection)'
    },
    'face_detector': {
        'url': 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        'filename': 'face_detector.tflite',
        'description': 'Face Detector (for presence detection)'
    }
}

def download_model(name, info):
    """Download a model file using curl"""
    filepath = os.path.join(MODELS_DIR, info['filename'])
    
    if os.path.exists(filepath):
        file_size = os.path.getsize(filepath)
        if file_size > 1000:  # Make sure it's not an error file
            print(f"✓ {info['description']} already exists: {filepath}")
            return True
        else:
            print(f"⚠ {info['description']} exists but seems corrupted, re-downloading...")
            os.remove(filepath)
    
    print(f"Downloading {info['description']}...")
    print(f"  URL: {info['url']}")
    print(f"  Saving to: {filepath}")
    
    try:
        # Use curl to download (works well on macOS/Linux, also available on Windows)
        result = subprocess.run(
            ['curl', '-L', '-o', filepath, info['url']],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            size_mb = file_size / (1024 * 1024)
            print(f"✓ Downloaded {info['description']} ({size_mb:.1f}MB)")
            return True
        else:
            print(f"✗ Failed to download {info['description']}")
            if result.stderr:
                print(f"  Error: {result.stderr}")
            print(f"\n  Manual download:")
            print(f"  1. Download from: {info['url']}")
            print(f"  2. Save to: {filepath}\n")
            return False
    except FileNotFoundError:
        print(f"✗ 'curl' command not found. Trying alternative method...")
        try:
            # Fallback to Python's urllib if curl is not available
            import urllib.request
            urllib.request.urlretrieve(info['url'], filepath)
            file_size = os.path.getsize(filepath)
            size_mb = file_size / (1024 * 1024)
            print(f"✓ Downloaded {info['description']} ({size_mb:.1f}MB)")
            return True
        except Exception as e:
            print(f"✗ Failed to download {info['description']}: {e}")
            print(f"\n  Manual download:")
            print(f"  1. Download from: {info['url']}")
            print(f"  2. Save to: {filepath}\n")
            return False
    except Exception as e:
        print(f"✗ Failed to download {info['description']}: {e}")
        print(f"\n  Manual download:")
        print(f"  1. Download from: {info['url']}")
        print(f"  2. Save to: {filepath}\n")
        return False

def main():
    print("=" * 60)
    print("EyeCu Study - MediaPipe Models Setup")
    print("=" * 60)
    print(f"\nModels directory: {MODELS_DIR}\n")
    
    success_count = 0
    for name, info in MODELS.items():
        if download_model(name, info):
            success_count += 1
        print()  # Empty line between downloads
    
    print("=" * 60)
    if success_count == len(MODELS):
        print("✓ Setup complete! All models downloaded successfully.")
        print(f"\nModel files are in: {MODELS_DIR}")
        print("\nYou can now run the app:")
        print("  python3 app.py")
        print("\nThen open: http://localhost:5001")
        return 0
    else:
        print(f"⚠ Warning: Only {success_count}/{len(MODELS)} models downloaded.")
        print("\nEye tracking may not work without all models.")
        print("Please check the errors above and try again, or download manually.")
        return 1

if __name__ == '__main__':
    sys.exit(main())

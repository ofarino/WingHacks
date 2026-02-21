"""
Presence detection module
Detects if user is present in front of camera
"""

import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image as MPImage, ImageFormat
import time
from typing import Optional, Tuple


class PresenceDetector:
    """
    Detects user presence using face detection
    """
    
    def __init__(self):
        """Initialize MediaPipe Face Detector"""
        # Get model path
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'models', 'face_detector.tflite')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Face detector model not found at {model_path}\n"
                "Please run: python setup_models.py"
            )
        
        # Create Face Detector options
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            min_detection_confidence=0.5
        )
        
        self.face_detector = vision.FaceDetector.create_from_options(options)
        
        self.last_detected_time = None
        self.is_present = False
        
    def detect_presence(self, frame) -> Tuple[bool, Optional[float]]:
        """
        Detect if a face is present in the frame
        
        Returns:
            Tuple of (is_present, confidence)
        """
        # Convert frame to MediaPipe Image
        mp_image = MPImage(image_format=ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Process the frame
        detection_result = self.face_detector.detect(mp_image)
        
        if detection_result.detections:
            self.last_detected_time = time.time()
            self.is_present = True
            # Get confidence of first detection
            confidence = detection_result.detections[0].categories[0].score
            return True, confidence
        else:
            self.is_present = False
            return False, None
    
    def get_time_since_last_detection(self) -> Optional[float]:
        """
        Get time in seconds since last face detection
        
        Returns:
            Seconds since last detection, or None if never detected
        """
        if self.last_detected_time is None:
            return None
        return time.time() - self.last_detected_time
    
    def reset(self):
        """Reset presence tracking state"""
        self.last_detected_time = None
        self.is_present = False
    
    def cleanup(self):
        """Release resources"""
        self.face_detector.close()

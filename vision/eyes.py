"""
Eye tracking module using MediaPipe Face Landmarker
Detects eye closure and tracks duration
"""

import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image as MPImage, ImageFormat
import time
from typing import Tuple, Optional
import numpy as np


class EyeTracker:
    """
    Tracks eyes using MediaPipe Face Landmarker to detect when eyes are closed
    """
    
    # Eye landmarks for MediaPipe Face Mesh
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    
    # Threshold for determining if eyes are closed (Eye Aspect Ratio)
    EAR_THRESHOLD = 0.21
    
    def __init__(self):
        """Initialize MediaPipe Face Landmarker"""
        # Get model path
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'models', 'face_landmarker.task')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Face landmarker model not found at {model_path}\n"
                "Please run: python setup_models.py"
            )
        
        # Create Face Landmarker options
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)
        
        self.eyes_closed_start_time = None
        self.total_closed_duration = 0.0
        self.is_currently_closed = False
        
    def calculate_ear(self, eye_landmarks) -> float:
        """
        Calculate Eye Aspect Ratio (EAR)
        EAR = (vertical1 + vertical2) / (2 * horizontal)
        """
        # Vertical distances
        vertical1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        vertical2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        
        # Horizontal distance
        horizontal = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        
        # Avoid division by zero
        if horizontal == 0:
            return 1.0
            
        ear = (vertical1 + vertical2) / (2.0 * horizontal)
        return ear
    
    def get_eye_landmarks(self, face_landmarks, indices) -> np.ndarray:
        """Extract eye landmark coordinates"""
        landmarks = []
        for idx in indices:
            landmark = face_landmarks[idx]
            landmarks.append([landmark.x, landmark.y])
        return np.array(landmarks, dtype=np.float32)
    
    def are_eyes_closed(self, frame) -> Tuple[bool, float, float]:
        """
        Detect if eyes are closed
        
        Returns:
            Tuple of (eyes_closed, left_ear, right_ear)
        """
        # Convert frame to MediaPipe Image
        mp_image = MPImage(image_format=ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Process the frame
        detection_result = self.face_landmarker.detect(mp_image)
        
        if not detection_result.face_landmarks:
            return False, 0.0, 0.0
        
        face_landmarks = detection_result.face_landmarks[0]
        
        # Get eye landmarks
        left_eye = self.get_eye_landmarks(face_landmarks, self.LEFT_EYE_INDICES)
        right_eye = self.get_eye_landmarks(face_landmarks, self.RIGHT_EYE_INDICES)
        
        # Calculate EAR for both eyes
        left_ear = self.calculate_ear(left_eye)
        right_ear = self.calculate_ear(right_eye)
        
        # Average EAR
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Eyes are closed if EAR is below threshold
        eyes_closed = avg_ear < self.EAR_THRESHOLD
        
        return eyes_closed, left_ear, right_ear
    
    def update_closed_duration(self, eyes_closed: bool) -> float:
        """
        Track how long eyes have been closed
        
        Returns:
            Current closed duration in seconds
        """
        current_time = time.time()
        
        if eyes_closed:
            if not self.is_currently_closed:
                # Eyes just closed
                self.eyes_closed_start_time = current_time
                self.is_currently_closed = True
            
            # Calculate duration
            if self.eyes_closed_start_time:
                duration = current_time - self.eyes_closed_start_time
                return duration
        else:
            # Eyes are open
            if self.is_currently_closed:
                # Eyes just opened, reset
                self.is_currently_closed = False
                self.eyes_closed_start_time = None
        
        return 0.0
    
    def check_alert_threshold(self, duration: float, threshold: float = 15.0) -> bool:
        """
        Check if eyes have been closed longer than threshold
        
        Args:
            duration: Current closed duration in seconds
            threshold: Alert threshold in seconds (default: 15)
            
        Returns:
            True if alert should be triggered
        """
        return duration >= threshold
    
    def reset(self):
        """Reset tracking state"""
        self.eyes_closed_start_time = None
        self.total_closed_duration = 0.0
        self.is_currently_closed = False
    
    def cleanup(self):
        """Release resources"""
        self.face_landmarker.close()

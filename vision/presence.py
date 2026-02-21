"""
Presence detection module
Detects if user is present in front of camera
"""

import cv2
import mediapipe as mp
import time
from typing import Optional, Tuple


class PresenceDetector:
    """
    Detects user presence using face detection
    """
    
    def __init__(self):
        """Initialize MediaPipe Face Detection"""
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=0.5
        )
        
        self.last_detected_time = None
        self.is_present = False
        
    def detect_presence(self, frame) -> Tuple[bool, Optional[float]]:
        """
        Detect if a face is present in the frame
        
        Returns:
            Tuple of (is_present, confidence)
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = self.face_detection.process(rgb_frame)
        
        if results.detections:
            self.last_detected_time = time.time()
            self.is_present = True
            # Get confidence of first detection
            confidence = results.detections[0].score[0]
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
        self.face_detection.close()

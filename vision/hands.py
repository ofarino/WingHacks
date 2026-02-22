"""
Hand gesture detection using MediaPipe Hands.
Detects open palm and closed fist gestures.
Uses MediaPipe 0.10+ task-based API.
"""

import cv2
import numpy as np
from typing import Optional
import os

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    from mediapipe import Image, ImageFormat
    MEDIAPIPE_AVAILABLE = True
except ImportError as e:
    print(f"MediaPipe import error: {e}")
    MEDIAPIPE_AVAILABLE = False


class HandGestureDetector:
    """Detects hand gestures (open palm, closed fist) using MediaPipe Hands."""
    
    def __init__(self):
        """Initialize MediaPipe Hand Landmarker."""
        if not MEDIAPIPE_AVAILABLE:
            raise ImportError("MediaPipe not available. Install with: pip install mediapipe>=0.10.0")
        
        # Get the model path
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        model_path = os.path.join(model_dir, 'hand_landmarker.task')
        
        # Check if model exists, if not, we'll skip hand detection
        if not os.path.exists(model_path):
            print(f"⚠️ Hand landmarker model not found at {model_path}")
            print("   Hand gesture detection will be disabled.")
            print("   To enable it, download the model from:")
            print("   https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")
            self.detector = None
            return
        
        # Create the hand landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.detector = vision.HandLandmarker.create_from_options(options)
        print("✅ Hand gesture detector initialized")
        
    def detect_gesture(self, frame: np.ndarray) -> Optional[str]:
        """
        Detect hand gesture in frame.
        
        Args:
            frame: Input BGR image from webcam
            
        Returns:
            gesture_name: 'open_palm', 'fist', or None
        """
        if frame is None or self.detector is None:
            return None
            
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create MediaPipe Image
            mp_image = Image(image_format=ImageFormat.SRGB, data=rgb_frame)
            
            # Detect hands
            detection_result = self.detector.detect(mp_image)
            
            if not detection_result.hand_landmarks:
                return None
            
            # Get first hand landmarks
            hand_landmarks = detection_result.hand_landmarks[0]
            
            # Classify gesture
            gesture = self._classify_gesture(hand_landmarks)
            return gesture
            
        except Exception as e:
            print(f"Error detecting gesture: {e}")
            return None
    
    def _classify_gesture(self, hand_landmarks) -> Optional[str]:
        """
        Classify hand gesture based on landmarks.
        
        Args:
            hand_landmarks: List of MediaPipe hand landmarks
            
        Returns:
            'open_palm', 'fist', or None
        """
        # hand_landmarks is a list of NormalizedLandmark objects
        # Each has .x, .y, .z properties
        
        # Finger tip indices: thumb, index, middle, ring, pinky
        fingertip_ids = [4, 8, 12, 16, 20]
        # Finger pip (middle joint) indices
        finger_pip_ids = [2, 6, 10, 14, 18]
        
        # Check if fingers are extended
        fingers_extended = []
        
        # Thumb (special case - check x-coordinate difference)
        thumb_tip = hand_landmarks[4]
        thumb_ip = hand_landmarks[3]
        thumb_mcp = hand_landmarks[2]
        # Thumb extended if tip is far from palm
        thumb_extended = abs(thumb_tip.x - thumb_mcp.x) > 0.05
        fingers_extended.append(thumb_extended)
        
        # Other fingers (check y-coordinate - tip should be above pip joint)
        for tip_id, pip_id in zip(fingertip_ids[1:], finger_pip_ids[1:]):
            tip = hand_landmarks[tip_id]
            pip = hand_landmarks[pip_id]
            extended = tip.y < pip.y - 0.03  # Tip significantly above pip = extended
            fingers_extended.append(extended)
        
        # Detect Open Palm: All 5 fingers extended
        if all(fingers_extended):
            return 'open_palm'
        
        # Detect Fist: All fingers curled (none extended)
        # Allow up to 1 finger slightly extended for more lenient detection
        if sum(fingers_extended) <= 1:
            return 'fist'
        
        return None
    
    def release(self):
        """Release resources."""
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()

"""
Video stream handler for webcam access
Manages camera capture and frame processing
"""

import cv2
import threading
import time
from typing import Optional
from .eyes import EyeTracker
from .presence import PresenceDetector
from .hands import HandGestureDetector


class VideoStream:
    """
    Manages video capture from webcam with eye tracking
    """
    
    def __init__(self, camera_id: int = 0):
        """
        Initialize video stream
        
        Args:
            camera_id: Camera device ID (default: 0)
        """
        import os
        # Set environment variable to skip OpenCV auth request
        os.environ['OPENCV_AVFOUNDATION_SKIP_AUTH'] = '1'
        
        self.camera_id = camera_id
        self.capture = None
        self.frame = None
        self.is_running = False
        self.lock = threading.Lock()
        
        # Initialize trackers
        self.eye_tracker = EyeTracker()
        self.presence_detector = PresenceDetector()
        self.hand_detector = HandGestureDetector()
        
        # Tracking state
        self.eyes_closed_duration = 0.0
        self.alert_triggered = False
        self.is_present = False
        self.current_gesture = None
        self.last_gesture_time = 0
        self.gesture_cooldown = 1.5  # 1.5 second cooldown between gestures
        
    def start(self):
        """Start the video stream"""
        if self.is_running:
            return
        
        self.capture = cv2.VideoCapture(self.camera_id)
        
        if not self.capture.isOpened():
            raise RuntimeError("Failed to open camera")
        
        self.is_running = True
        
        # Start background thread for frame capture
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        
    def _capture_loop(self):
        """Background loop for continuous frame capture"""
        while self.is_running:
            ret, frame = self.capture.read()
            
            if not ret:
                continue
            
            with self.lock:
                self.frame = frame
                
            # Small delay to prevent excessive CPU usage
            time.sleep(0.03)  # ~30 FPS
    
    def get_frame(self) -> Optional[bytes]:
        """
        Get current frame as JPEG bytes
        
        Returns:
            JPEG encoded frame or None
        """
        with self.lock:
            if self.frame is None:
                return None
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', self.frame)
            if ret:
                return buffer.tobytes()
        return None
    
    def process_frame_for_eyes(self) -> dict:
        """
        Process current frame for eye tracking
        
        Returns:
            Dictionary with tracking results
        """
        with self.lock:
            if self.frame is None:
                return {
                    'success': False,
                    'error': 'No frame available'
                }
            
            frame = self.frame.copy()
        
        # Detect eyes closed
        eyes_closed, left_ear, right_ear = self.eye_tracker.are_eyes_closed(frame)
        
        # Update duration
        duration = self.eye_tracker.update_closed_duration(eyes_closed)
        self.eyes_closed_duration = duration
        
        # Check if alert should be triggered (10 second threshold)
        should_alert = self.eye_tracker.check_alert_threshold(duration, threshold=10.0)
        
        # Trigger alert only once per closure event
        if should_alert and not self.alert_triggered:
            self.alert_triggered = True
        elif not eyes_closed:
            self.alert_triggered = False
        
        return {
            'success': True,
            'eyes_closed': bool(eyes_closed),  # Convert to Python bool
            'duration': float(round(duration, 2)),  # Convert to Python float
            'left_ear': float(round(left_ear, 3)),  # Convert to Python float
            'right_ear': float(round(right_ear, 3)),  # Convert to Python float
            'alert_triggered': bool(self.alert_triggered)  # Convert to Python bool
        }
    
    def process_frame_for_presence(self) -> dict:
        """
        Process current frame for presence detection
        
        Returns:
            Dictionary with presence results
        """
        with self.lock:
            if self.frame is None:
                return {
                    'success': False,
                    'error': 'No frame available'
                }
            
            frame = self.frame.copy()
        
        # Detect presence
        is_present, confidence = self.presence_detector.detect_presence(frame)
        self.is_present = is_present
        
        time_since_last = self.presence_detector.get_time_since_last_detection()
        
        return {
            'success': True,
            'present': bool(is_present),
            'confidence': float(round(confidence, 3)) if confidence else None,
            'time_since_last_detection': float(round(time_since_last, 2)) if time_since_last else None
        }
    
    def process_frame_for_hands(self) -> dict:
        """
        Process current frame for hand gesture detection
        
        Returns:
            Dictionary with gesture results
        """
        with self.lock:
            if self.frame is None:
                return {
                    'success': False,
                    'error': 'No frame available'
                }
            
            frame = self.frame.copy()
        
        # Detect gesture
        gesture = self.hand_detector.detect_gesture(frame)
        
        current_time = time.time()
        gesture_detected = None
        
        # Debug logging
        if gesture:
            print(f"🖐️ Raw gesture detected: {gesture}")
        
        # Only register gesture if cooldown has passed
        if gesture and (current_time - self.last_gesture_time) > self.gesture_cooldown:
            gesture_detected = gesture
            self.current_gesture = gesture
            self.last_gesture_time = current_time
            print(f"✅ Gesture registered (after cooldown): {gesture}")
        elif gesture:
            time_left = self.gesture_cooldown - (current_time - self.last_gesture_time)
            print(f"⏳ Gesture in cooldown, {time_left:.1f}s remaining")
        
        return {
            'success': True,
            'gesture': gesture_detected,
            'last_gesture': self.current_gesture,
            'timestamp': float(current_time)
        }
    
    def get_status(self) -> dict:
        """
        Get current tracking status
        
        Returns:
            Dictionary with all tracking information
        """
        try:
            eye_data = self.process_frame_for_eyes()
        except Exception as e:
            print(f"Error in process_frame_for_eyes: {e}")
            import traceback
            traceback.print_exc()
            eye_data = {
                'success': False,
                'error': str(e)
            }
        
        try:
            presence_data = self.process_frame_for_presence()
        except Exception as e:
            print(f"Error in process_frame_for_presence: {e}")
            import traceback
            traceback.print_exc()
            presence_data = {
                'success': False,
                'error': str(e)
            }
        
        try:
            gesture_data = self.process_frame_for_hands()
        except Exception as e:
            print(f"Error in process_frame_for_hands: {e}")
            import traceback
            traceback.print_exc()
            gesture_data = {
                'success': False,
                'error': str(e)
            }
        
        return {
            'camera_active': self.is_running,
            'eyes': eye_data,
            'presence': presence_data,
            'gesture': gesture_data
        }
    
    def reset_tracking(self):
        """Reset all tracking state"""
        self.eye_tracker.reset()
        self.presence_detector.reset()
        self.alert_triggered = False
        self.eyes_closed_duration = 0.0
    
    def stop(self):
        """Stop the video stream"""
        self.is_running = False
        
        if self.thread:
            self.thread.join(timeout=2.0)
        
        if self.capture:
            self.capture.release()
        
        # Cleanup trackers
        self.eye_tracker.cleanup()
        self.presence_detector.cleanup()
        self.hand_detector.release()


# Global video stream instance (singleton pattern)
_video_stream = None


def get_video_stream() -> VideoStream:
    """Get or create the global video stream instance"""
    global _video_stream
    if _video_stream is None:
        _video_stream = VideoStream()
    return _video_stream


def stop_video_stream():
    """Stop and cleanup the global video stream"""
    global _video_stream
    if _video_stream is not None:
        _video_stream.stop()
        _video_stream = None

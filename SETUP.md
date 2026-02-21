# EyeCu Study - Setup Guide

A Minecraft-themed Pomodoro study app with eye tracking to detect when you're falling asleep!

## Features
- 🎯 Task management with Pomodoro timer
- 👁️ Eye tracking that alerts you if your eyes are closed for 15+ seconds
- 🎨 Pixel art Minecraft theme
- 📚 Beautiful bookshelf background on tasks page

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd /Users/oliviafarino/WingHacks
pip install -r eyeCuStudy/requirements.txt
```

Required packages:
- Flask
- opencv-python
- mediapipe
- python-dotenv

### 2. Download MediaPipe Models

The eye tracking requires MediaPipe model files. Run:

```bash
python3 setup_models.py
```

This will download:
- `face_landmarker.task` (3.6MB) - For eye detection
- `face_detector.tflite` (224KB) - For presence detection

Models are saved in `vision/models/`

### 3. Run the Flask App

```bash
python3 app.py
```

The app will run on: `http://localhost:5001`

## How It Works

### Eye Tracking Flow

1. **Start Timer**: When you click the play button on the Pomodoro page
2. **Camera Activates**: Eye tracking starts automatically
3. **Monitoring**: JavaScript polls `/api/eye-tracking/status` every 2 seconds
4. **Detection**: Backend uses MediaPipe to detect:
   - Eye Aspect Ratio (EAR) to determine if eyes are closed
   - Duration of eye closure
5. **Alert**: If eyes are closed for 15+ seconds:
   - Popup alert appears with shaking animation
   - Screen flashes red
   - Alert sound plays (if available)
6. **Reset**: Click "I'm Awake!" to dismiss alert

### API Endpoints

- `POST /api/eye-tracking/start` - Start tracking
- `GET /api/eye-tracking/status` - Get current status
- `POST /api/eye-tracking/reset` - Reset tracking state
- `POST /api/eye-tracking/stop` - Stop tracking

### Changing the Alert Threshold

Default is 15 seconds. To change it, edit `vision/video_stream.py`:

```python
# Line 113
should_alert = self.eye_tracker.check_alert_threshold(duration, threshold=15.0)
```

Change `threshold=15.0` to your desired seconds.

## File Structure

```
WingHacks/
├── app.py                 # Flask app with API routes
├── setup_models.py        # Model downloader script
├── static/
│   ├── backgrounds/       # Pixel art backgrounds
│   ├── css/style.css      # Blockblueprint font & styles
│   ├── js/
│   │   ├── pomodoro.js    # Timer + eye tracking integration
│   │   └── task.js        # Task management
│   └── fonts/             # Blockblueprint.ttf
├── templates/
│   ├── landing.html       # Home page
│   ├── tasks.html         # Task list with bookshelf bg
│   └── pomodoro.html      # Timer page
└── vision/
    ├── eyes.py            # Eye tracking logic (EAR calculation)
    ├── presence.py        # Face detection
    ├── video_stream.py    # Webcam manager
    └── models/            # MediaPipe model files
```

## Troubleshooting

### Eye tracking not working
1. Check camera permissions (System Preferences > Security & Privacy > Camera)
2. Ensure models are downloaded: `ls vision/models/`
3. Check Flask console for errors
4. Open browser console (F12) to see JavaScript errors

### Alert not triggering
1. Check browser console - should see "Eyes closed for X seconds"
2. Verify threshold in `video_stream.py` (line 113)
3. Test by closing your eyes for 15+ seconds while timer is running

### Camera permission denied
- Grant permission in macOS System Preferences
- Restart Flask app after granting permission

### Models not downloading
- Models need to be in `vision/models/` directory
- If auto-download fails, manually download:
  - [Face Landmarker](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)
  - [Face Detector](https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite)

## Minecraft Theme Enhancements

Current features:
- ✅ Blockblueprint font (Minecraft-style)
- ✅ Pixel art bookshelf background
- ✅ Crisp pixel art rendering (no blur)

Ideas for more:
- Add Minecraft sounds (bell.wav, etc.)
- Pixel art UI buttons
- Experience bar as Pomodoro timer
- Heart icons for tasks
- Emerald/diamond icons for completed tasks
- Creeper face for alert popup

## Credits

- MediaPipe by Google
- Blockblueprint font
- Pixel art backgrounds

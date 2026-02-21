# 📷 Camera Permission Fix for macOS

If you're getting a 500 error when starting eye tracking, it's likely a camera permission issue.

## Quick Fix

The app is already configured to work around this. Just:

1. **Reload the page** in your browser
2. **Try starting the timer again**
3. macOS should show a permission popup - click **"Allow"**

## Manual Camera Permission Setup

If the automatic request doesn't work:

1. Open **System Preferences** (or **System Settings** on macOS Ventura+)
2. Go to **Security & Privacy** → **Privacy** → **Camera**
3. Find **Terminal** or **Python** in the list
4. Check the box to enable camera access
5. Restart the Flask app

## Environment Variable Set

The app automatically sets `OPENCV_AVFOUNDATION_SKIP_AUTH=1` to handle OpenCV camera initialization on macOS.

## Testing Camera Access

To verify camera works, try this in Terminal:

```bash
cd /Users/oliviafarino/WingHacks
source venv/bin/activate
python3 -c "import cv2; cap = cv2.VideoCapture(0); print('Camera OK!' if cap.isOpened() else 'Camera Failed'); cap.release()"
```

You should see "Camera OK!" if permissions are correct.

## Current Settings

✅ **Threshold changed to 10 seconds** (was 15)  
✅ **Camera permission handling added**  
✅ **Better error messages in console**  

## What to Expect

When the timer starts:
- Browser console shows: `✅ Eye tracking started!`
- Every 2 seconds you'll see: `Eyes closed for X seconds`
- If eyes closed for 10+ seconds: 🚨 WAKE UP alert appears!

## Still Not Working?

Check the Flask terminal output for specific error messages. Common issues:
- Camera in use by another app (Zoom, FaceTime, etc.)
- Multiple Python processes accessing camera
- Virtual camera software interfering

**Quick fix:** Quit all camera apps and restart Flask.

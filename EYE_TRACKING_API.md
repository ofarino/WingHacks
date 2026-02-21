# Eye Tracking API Documentation

## Overview
The eye tracking system monitors user's eyes during study sessions on the Pomodoro page. It detects when eyes are closed for 15+ seconds and can trigger alerts.

## Installation
First, install the vision dependencies:
```bash
source venv/bin/activate
pip install opencv-python mediapipe numpy
```

## API Endpoints

### 1. Start Eye Tracking
**POST** `/api/eye-tracking/start`

Start the eye tracking system (call this when Pomodoro timer starts).

**Response:**
```json
{
  "success": true,
  "message": "Eye tracking started"
}
```

---

### 2. Get Eye Tracking Status
**GET** `/api/eye-tracking/status`

Poll this endpoint regularly (e.g., every 2-3 seconds) to get current status.

**Response:**
```json
{
  "camera_active": true,
  "eyes": {
    "success": true,
    "eyes_closed": false,
    "duration": 0.0,
    "left_ear": 0.285,
    "right_ear": 0.290,
    "alert_triggered": false
  },
  "presence": {
    "success": true,
    "present": true,
    "confidence": 0.987,
    "time_since_last_detection": null
  }
}
```

**Key Fields:**
- `eyes.eyes_closed` (bool) - Are eyes currently closed?
- `eyes.duration` (float) - How long eyes have been closed (seconds)
- `eyes.alert_triggered` (bool) - **TRUE when eyes closed for 15+ seconds!**
- `presence.present` (bool) - Is user detected in frame?

---

### 3. Reset Eye Tracking
**POST** `/api/eye-tracking/reset`

Reset the tracking state (useful between Pomodoro sessions).

**Response:**
```json
{
  "success": true,
  "message": "Eye tracking state reset"
}
```

---

### 4. Stop Eye Tracking
**POST** `/api/eye-tracking/stop`

Stop eye tracking (call when Pomodoro timer ends or user leaves page).

**Response:**
```json
{
  "success": true,
  "message": "Eye tracking stopped"
}
```

---

## JavaScript Integration Example

```javascript
// When Pomodoro timer starts
async function startEyeTracking() {
    try {
        const response = await fetch('/api/eye-tracking/start', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            // Start polling for status
            startStatusPolling();
        }
    } catch (error) {
        console.error('Failed to start eye tracking:', error);
    }
}

// Poll status every 2 seconds
let pollInterval = null;

function startStatusPolling() {
    pollInterval = setInterval(checkEyeStatus, 2000);
}

function stopStatusPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

async function checkEyeStatus() {
    try {
        const response = await fetch('/api/eye-tracking/status');
        const data = await response.json();
        
        if (data.eyes && data.eyes.alert_triggered) {
            // TRIGGER YOUR ALERT HERE!
            // Eyes have been closed for 15+ seconds
            triggerWakeUpAlert();
        }
        
        // Optional: Update UI with status
        updateStatusDisplay(data);
        
    } catch (error) {
        console.error('Failed to check eye status:', error);
    }
}

function triggerWakeUpAlert() {
    // TODO: Add your visual/audio alert here
    console.log('Wake up! Eyes closed for too long!');
    
    // Example: Play sound
    // const audio = new Audio('/static/audio/alert.mp3');
    // audio.play();
    
    // Example: Show modal/notification
    // showWakeUpModal();
}

// When Pomodoro timer stops
async function stopEyeTracking() {
    stopStatusPolling();
    
    try {
        await fetch('/api/eye-tracking/stop', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Failed to stop eye tracking:', error);
    }
}

// Call when page unloads
window.addEventListener('beforeunload', stopEyeTracking);
```

---

## Integration Checklist

1. **On Pomodoro Page Load / Timer Start:**
   - [ ] Call `/api/eye-tracking/start`
   - [ ] Start polling `/api/eye-tracking/status` every 2-3 seconds

2. **During Pomodoro Session:**
   - [ ] Check `alert_triggered` field in status response
   - [ ] Trigger visual/audio alert when `alert_triggered === true`

3. **On Timer Stop / Page Leave:**
   - [ ] Stop polling
   - [ ] Call `/api/eye-tracking/stop`

4. **Between Sessions:**
   - [ ] Call `/api/eye-tracking/reset` to clear state

---

## Configuration

The eye tracking parameters can be adjusted in `vision/eyes.py`:

- **EAR_THRESHOLD** (default: 0.21) - Lower = more sensitive to eye closure
- **Alert threshold** (default: 15.0 seconds) - Time before alert triggers

---

## Troubleshooting

### Camera Permission
- Browser will ask for camera permission on first use
- User must allow camera access for tracking to work

### No Camera Available
- Check that `/api/eye-tracking/status` returns `"camera_active": true`
- If false, vision packages may not be installed

### Performance
- Tracking runs in background thread
- Minimal CPU usage (~30 FPS)
- Polling every 2-3 seconds is recommended

---

## Notes

- Eye tracking only runs when explicitly started (not automatic)
- Designed to work only on Pomodoro page
- No video is recorded or stored - only real-time processing
- Alert triggers only ONCE per eye closure event (won't spam)

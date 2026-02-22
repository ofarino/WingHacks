// Remove or comment out the bell sound for now (file doesn't exist)
// const bells = new Audio("./sounds/bell.wav");
const toggleBtn = document.querySelector(".btn-toggle");
const session = document.querySelector(".minutes");
const currentTaskText = document.querySelector(".current-task-text");
let myInterval;
let isRunning = false;
let totalSeconds = 0;
let tasks = [];
let isBreakTime = false;
let currentAlertSound = null; // Track the current alert sound
let currentBgMusic = null; // Track background music
let lastPresenceStatus = true; // Track if user was present
let presenceAlertShown = false; // Track if presence alert is showing

// Load timer settings and update display
function loadTimerSettings() {
  const timerSettings = localStorage.getItem('timerSettings');
  if (timerSettings) {
    // Parse the work duration from the split (e.g., "25-5" -> 25)
    const workDuration = parseFloat(timerSettings.split('-')[0]);
    session.textContent = Math.floor(workDuration);
  }
}

// Load tasks from localStorage and display current task
function loadTasks() {
  const savedTasks = localStorage.getItem('studyTasks');
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
    displayCurrentTask();
  } else {
    currentTaskText.textContent = "Current task: No tasks available";
  }
}

// Map subject to background video
const subjectVideos = {
  'Math': 'math.mp4',
  'Science': 'science.mp4',
  'Reading': 'reading.mp4',
  'Writing': 'writing.mp4',
  'History': 'history.mp4',
  'Coding': 'coding.mp4',
  'Art': 'art.mp4',
  'Other': 'other.mp4',
};

// Map subject to background music
const subjectAudio = {
  'Math': 'math.mp3',
  'Science': 'science.mp3',
  'Reading': 'read.mp3',
  'Writing': 'writing1.mp3',
  'History': 'history.mp3',
  'Coding': 'coding.mp3',
  'Art': 'Arty.mp3',
};
const otherAudioOptions = ['math.mp3', 'science.mp3', 'read.mp3', 'writing1.mp3', 'history.mp3', 'coding.mp3', 'Arty.mp3'];

function playBgMusic(file) {
  if (currentBgMusic) {
    currentBgMusic.pause();
    currentBgMusic = null;
  }
  if (!file) return;
  currentBgMusic = new Audio(`/static/audio/${file}`);
  currentBgMusic.loop = true;
  currentBgMusic.volume = 0.5;
  currentBgMusic.play().catch(err => console.log('Music play failed:', err));
}

function setMusicBySubject(subject) {
  let file = subjectAudio[subject];
  if (subject === 'Other') {
    file = otherAudioOptions[Math.floor(Math.random() * otherAudioOptions.length)];
  }
  playBgMusic(file || null);
}

function setBackgroundBySubject(tasks) {
  if (!tasks || tasks.length === 0) return;
  // Use the current (first) task's subject
  const currentSubject = tasks[0].topic;
  const videoFile = subjectVideos[currentSubject];
  const bgVideo = document.getElementById('bg-video');
  if (videoFile) {
    bgVideo.src = `/static/backgrounds/${videoFile}`;
    bgVideo.load();
    bgVideo.play();
  } else {
    bgVideo.src = '';
    bgVideo.load();
  }
}

function displayCurrentTask() {
  const taskCompleteBox = document.querySelector('.task-complete-box');
  const taskCheckbox = document.getElementById('taskCheckbox');
  
  if (tasks.length > 0) {
    // Always use the first task (index 0) since we shift completed tasks
    const task = tasks[0];
    currentTaskText.textContent = `Current task: ${task.name}`;
    setBackgroundBySubject(tasks);
    setMusicBySubject(task.topic);
    
    // Show checkbox only during work time (not during break)
    if (taskCompleteBox && !isBreakTime) {
      taskCompleteBox.style.display = 'block';
      if (taskCheckbox) {
        taskCheckbox.checked = false;
      }
    }
  } else {
    currentTaskText.textContent = "Current task: All tasks completed!";
    
    // Hide checkbox if no tasks
    if (taskCompleteBox) {
      taskCompleteBox.style.display = 'none';
    }
  }
}

function moveToNextTask() {
  // Remove the completed task from the front of the array
  tasks.shift();
  // Update localStorage with remaining tasks
  localStorage.setItem('studyTasks', JSON.stringify(tasks));
  // Display the next task (now at index 0)
  displayCurrentTask();
}

const toggleTimer = () => {
  if (!isRunning) {
    // Start the timer
    isRunning = true;
    toggleBtn.textContent = "⏸";
    toggleBtn.classList.add("running");
    
    if (totalSeconds === 0) {
      // Calculate total seconds from both minutes and seconds display
      const minuteDiv = document.querySelector(".minutes");
      const secondDiv = document.querySelector(".seconds");
      const displayMinutes = parseInt(minuteDiv.textContent);
      const displaySeconds = parseInt(secondDiv.textContent);
      totalSeconds = (displayMinutes * 60) + displaySeconds;
    }
    
    myInterval = setInterval(updateSeconds, 1000);
    
    // Start eye tracking when timer starts (only during work time)
    if (!isBreakTime) {
      startEyeTracking();
    }
  } else {
    // Pause the timer
    isRunning = false;
    toggleBtn.textContent = "▶";
    toggleBtn.classList.remove("running");
    clearInterval(myInterval);
  }
};

const updateSeconds = () => {
  const minuteDiv = document.querySelector(".minutes");
  const secondDiv = document.querySelector(".seconds");

  totalSeconds--;

  let minutesLeft = Math.floor(totalSeconds / 60);
  let secondsLeft = totalSeconds % 60;

  if (secondsLeft < 10) {
    secondDiv.textContent = "0" + secondsLeft;
  } else {
    secondDiv.textContent = secondsLeft;
  }
  minuteDiv.textContent = `${minutesLeft}`;

  if (minutesLeft === 0 && secondsLeft === 0) {
    // bells.play(); // Commented out - no sound file yet
    clearInterval(myInterval);
    isRunning = false;
    toggleBtn.textContent = "▶";
    toggleBtn.classList.remove("running");
    totalSeconds = 0;
    
    if (isBreakTime) {
      // Break finished - switch back to work time (keep same task)
      isBreakTime = false;
      updateSessionMode();
      
      // Reset to work duration
      const timerSettings = localStorage.getItem('timerSettings') || '25-5';
      const workDuration = parseFloat(timerSettings.split('-')[0]);
      session.textContent = Math.floor(workDuration);
      document.querySelector('.seconds').textContent = '00';
    } else {
      // Work session finished - stop eye tracking and start break
      stopEyeTracking();
      isBreakTime = true;
      updateSessionMode();
      
      // Set break duration
      const timerSettings = localStorage.getItem('timerSettings') || '25-5';
      const breakDuration = parseFloat(timerSettings.split('-')[1]);
      const breakMinutes = Math.floor(breakDuration);
      const breakSeconds = Math.round((breakDuration - breakMinutes) * 60);
      
      session.textContent = breakMinutes;
      document.querySelector('.seconds').textContent = breakSeconds < 10 ? '0' + breakSeconds : breakSeconds;
      
      // Auto-start break timer
      setTimeout(() => {
        toggleTimer();
      }, 1000);
    }
  }
};

function updateSessionMode() {
  const sessionModeElement = document.querySelector('.session-mode');
  const taskCompleteBox = document.querySelector('.task-complete-box');
  const brownOutline = '-2px -2px 0 #6B3A2A, 2px -2px 0 #6B3A2A, -2px 2px 0 #6B3A2A, 2px 2px 0 #6B3A2A';
  
  if (isBreakTime) {
    sessionModeElement.textContent = 'Break Time';
    sessionModeElement.style.color = '#fff';
    sessionModeElement.style.textShadow = brownOutline;
    // Hide task checkbox during break
    if (taskCompleteBox) {
      taskCompleteBox.style.display = 'none';
    }
    playBgMusic('break.mp3');
  } else {
    sessionModeElement.textContent = 'Work Time';
    sessionModeElement.style.color = '#fff';
    sessionModeElement.style.textShadow = brownOutline;
    // Show task checkbox during work (if tasks exist)
    if (taskCompleteBox && tasks.length > 0) {
      taskCompleteBox.style.display = 'block';
    }
    if (tasks.length > 0) setMusicBySubject(tasks[0].topic);
  }
}

toggleBtn.addEventListener("click", toggleTimer);

// Load tasks and timer settings when page loads
loadTimerSettings();
loadTasks();

// Handle task completion checkbox
document.addEventListener('DOMContentLoaded', function() {
  const taskCheckbox = document.getElementById('taskCheckbox');
  if (taskCheckbox) {
    taskCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Small delay for visual feedback
        setTimeout(() => {
          moveToNextTask();
        }, 300);
      }
    });
  }
});

async function startEyeTracking() {
    try {
        const response = await fetch('/api/eye-tracking/start', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Eye tracking started!');
            startStatusPolling(); // Start checking status
        } else {
            console.error('❌ Eye tracking failed to start:', data.error);
            // Show user-friendly message
            if (data.error && data.error.includes('camera')) {
                alert('⚠️ Camera access needed!\n\nPlease grant camera permissions in System Preferences > Security & Privacy > Camera');
            }
        }
    } catch (error) {
        console.error('❌ Failed to start eye tracking:', error);
    }
}
let pollInterval = null;

function startStatusPolling() {
    // Check status every 2 seconds
    pollInterval = setInterval(checkEyeStatus, 2000);
}

async function checkEyeStatus() {
    try {
        const response = await fetch('/api/eye-tracking/status');
        const data = await response.json();
        
        if (!data || !data.camera_active) return;
        
        // Debug: Log gesture data
        if (data.gesture) {
            console.log('Gesture data:', data.gesture);
        }
        
        // 1. Handle Hand Gestures (only during work time)
        if (data.gesture && data.gesture.success && data.gesture.gesture) {
            const gesture = data.gesture.gesture;
            console.log('🖐️ Gesture detected in frontend:', gesture);
            
            // Open Palm = Pause (if timer is running)
            if (gesture === 'open_palm' && isRunning && !isBreakTime) {
                console.log('✋ Open palm detected - Pausing timer');
                pauseTimerFromGesture();
                showGestureAlert('⏸️ Paused with hand gesture');
            }
            
            // Closed Fist = Resume (if timer is paused)
            console.log(`Fist check: gesture=${gesture}, isRunning=${isRunning}, totalSeconds=${totalSeconds}, isBreakTime=${isBreakTime}`);
            if (gesture === 'fist' && !isRunning && totalSeconds > 0 && !isBreakTime) {
                console.log('✊ Closed fist detected - Resuming timer');
                resumeTimerFromGesture();
                showGestureAlert('▶️ Resumed with hand gesture');
            } else if (gesture === 'fist') {
                console.log(`❌ Fist detected but conditions not met: isRunning=${isRunning}, totalSeconds=${totalSeconds}, isBreakTime=${isBreakTime}`);
            }
        }
        
        // 2. Handle Presence Detection (only during work time)
        if (data.presence && data.presence.success && !isBreakTime) {
            const isPresent = data.presence.present;
            
            // Debug logging
            if (presenceAlertShown) {
                console.log(`👤 Presence status: ${isPresent ? 'PRESENT' : 'AWAY'} | Alert shown: ${presenceAlertShown}`);
            }
            
            // User left (was present, now not present)
            if (lastPresenceStatus && !isPresent && isRunning && !presenceAlertShown) {
                console.log('❌ User left - Pausing timer and showing alert');
                pauseTimerFromGesture();
                showPresenceAlert();
                presenceAlertShown = true;
            }
            
            // IMPORTANT: Do NOT dismiss alert automatically when user returns
            // The alert must be manually dismissed by clicking the X button
            
            lastPresenceStatus = isPresent;
        }
        
        // 3. Handle Eye Closure (only during work time and when present)
        if (data.eyes && data.eyes.alert_triggered && !isBreakTime && lastPresenceStatus) {
            triggerWakeUpAlert();
        }
        
        // Optional: Show duration on screen
        if (data.eyes && data.eyes.eyes_closed) {
            console.log(`Eyes closed for ${data.eyes.duration} seconds`);
        }
        
    } catch (error) {
        console.error('❌ Failed to check eye status:', error);
    }
}
function triggerWakeUpAlert() {
    console.log('⚠️ WAKE UP! Eyes closed too long!');
    
    // Check if alert already exists
    if (document.getElementById('wake-up-alert')) {
        return; // Don't create duplicate alerts
    }
    
    // Pause the timer
    if (isRunning) {
        clearInterval(myInterval);
        toggleBtn.textContent = "▶";
        toggleBtn.classList.remove("running");
    }
    
    // Play alert sound
    currentAlertSound = new Audio('/static/audio/eyeClosedSound.mp3');
    currentAlertSound.play().catch(err => console.log('Audio play failed:', err));
    
    // Resume timer when sound ends
    currentAlertSound.addEventListener('ended', () => {
        resumeTimerAfterAlert();
    });
    
    // Create Minecraft-style notification
    const alertDiv = document.createElement('div');
    alertDiv.id = 'wake-up-alert';
    alertDiv.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border: 2px solid #555;
            z-index: 10000;
            text-align: center;
            font-family: 'Blockblueprint', Arial, sans-serif;
            font-size: 1rem;
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
            cursor: pointer;
            image-rendering: pixelated;
        " onclick="dismissAlert()">
            You may not rest now, there's still work to do!
        </div>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(dismissAlert, 5000);
}

function dismissAlert() {
    const alert = document.getElementById('wake-up-alert');
    if (alert) {
        alert.remove();
    }
    
    // Stop the alert sound if it's still playing
    if (currentAlertSound) {
        currentAlertSound.pause();
        currentAlertSound.currentTime = 0;
        currentAlertSound = null;
    }
    
    // Resume the timer
    resumeTimerAfterAlert();
}

function resumeTimerAfterAlert() {
    // Only resume if timer was running before the alert
    if (!isRunning && totalSeconds > 0) {
        isRunning = true;
        toggleBtn.textContent = "⏸";
        toggleBtn.classList.add("running");
        myInterval = setInterval(updateSeconds, 1000);
    }
}

// Helper functions for gesture control
function pauseTimerFromGesture() {
    if (isRunning) {
        clearInterval(myInterval);
        isRunning = false;
        toggleBtn.textContent = "▶";
        toggleBtn.classList.remove("running");
    }
}

function resumeTimerFromGesture() {
    console.log(`🔍 resumeTimerFromGesture called: isRunning=${isRunning}, totalSeconds=${totalSeconds}`);
    if (!isRunning && totalSeconds > 0) {
        console.log('✅ Resuming timer...');
        isRunning = true;
        toggleBtn.textContent = "⏸";
        toggleBtn.classList.add("running");
        myInterval = setInterval(updateSeconds, 1000);
        console.log('✅ Timer resumed successfully');
    } else {
        console.log(`❌ Cannot resume: isRunning=${isRunning}, totalSeconds=${totalSeconds}`);
    }
}

function showGestureNotification(message) {
    // Remove existing notification if present
    const existing = document.getElementById('gesture-notification');
    if (existing) {
        existing.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.id = 'gesture-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(46, 204, 113, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-family: var(--main-font--);
        font-size: 1rem;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

function showGestureAlert(message) {
    // Remove existing alert if present
    const existing = document.getElementById('gesture-alert');
    if (existing) {
        existing.remove();
    }
    
    // Create Minecraft-style gesture alert
    const alert = document.createElement('div');
    alert.id = 'gesture-alert';
    alert.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 12px 24px;
        border: 2px solid #555;
        font-family: 'Blockblueprint', Arial, sans-serif;
        font-size: 1rem;
        text-align: center;
        z-index: 10000;
        image-rendering: pixelated;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        animation: fadeInUp 0.3s ease-out;
        max-width: 90%;
        width: auto;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.style.animation = 'fadeOutDown 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }
    }, 2000);
}

function showPresenceAlert() {
    // Remove existing alert if present
    const existing = document.getElementById('presence-alert');
    if (existing) {
        return;
    }
    
    const alert = document.createElement('div');
    alert.id = 'presence-alert';
    alert.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 20px 30px 20px 20px;
        border: 2px solid #555;
        font-family: 'Blockblueprint', Arial, sans-serif;
        font-size: 1rem;
        text-align: center;
        z-index: 10000;
        image-rendering: pixelated;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        animation: fadeInUp 0.4s ease-out;
        max-width: 90%;
        width: auto;
        min-width: 300px;
    `;
    
    alert.innerHTML = `
        <button id="presence-alert-close-btn" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: transparent;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 25px;
            height: 25px;
            line-height: 25px;
            text-align: center;
            font-weight: bold;
        ">&times;</button>
        <div style="padding-right: 20px;">
            Pausing the timer. Please resume timer when you come back to keep mining away at your tasks!
        </div>
    `;
    
    // Add click handler to X button
    document.body.appendChild(alert);
    const closeBtn = document.getElementById('presence-alert-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', dismissPresenceAlertAndResume);
    }
}

function dismissPresenceAlertAndResume() {
    dismissPresenceAlert();
    resumeTimerFromGesture();
    presenceAlertShown = false; // Reset so it can trigger again if user leaves
}

function dismissPresenceAlert() {
    const alert = document.getElementById('presence-alert');
    if (alert) {
        alert.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }
}

function stopStatusPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

async function stopEyeTracking() {
    stopStatusPolling();
    
    try {
        await fetch('/api/eye-tracking/stop', {
            method: 'POST'
        });
        console.log('Eye tracking stopped');
    } catch (error) {
        console.error('Failed to stop eye tracking:', error);
    }
}

// Also stop when user leaves page
window.addEventListener('beforeunload', stopEyeTracking);

// Vibe menu functionality (placeholder for future implementation)
function toggleVibeMenu() {
    const allVideos = ['art.mp4', 'coding.mp4', 'history.mp4', 'math.mp4', 'other.mp4', 'random1.mp4', 'random2.mp4', 'random3.mp4', 'reading.mp4', 'science.mp4', 'writing.mp4'];
    const allAudio = ['math.mp3', 'science.mp3', 'read.mp3', 'writing1.mp3', 'history.mp3', 'coding.mp3', 'Arty.mp3'];

    const bgVideo = document.getElementById('bg-video');
    const currentVideo = bgVideo.src.split('/').pop();
    const videoChoices = allVideos.filter(v => v !== currentVideo);
    const pickedVideo = videoChoices[Math.floor(Math.random() * videoChoices.length)];
    bgVideo.src = `/static/backgrounds/${pickedVideo}`;
    bgVideo.load();
    bgVideo.play();

    const currentAudioFile = currentBgMusic ? currentBgMusic.src.split('/').pop() : null;
    const audioChoices = allAudio.filter(a => a !== currentAudioFile);
    const pickedAudio = audioChoices[Math.floor(Math.random() * audioChoices.length)];
    playBgMusic(pickedAudio);
}

// Timer modal functions
function openTimerModal() {
    const modal = document.getElementById('timerModal');
    modal.classList.add('active');
    
    // Highlight the currently selected timer
    const currentSettings = localStorage.getItem('timerSettings') || '25-5';
    document.querySelectorAll('.timer-option').forEach(option => {
        if (option.dataset.timer === currentSettings) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function closeTimerModal() {
    const modal = document.getElementById('timerModal');
    modal.classList.remove('active');
}

function changeTimer(timerValue) {
    // Save the new timer setting
    localStorage.setItem('timerSettings', timerValue);
    
    // Update the display if timer is not running
    if (!isRunning) {
        const workDuration = parseFloat(timerValue.split('-')[0]);
        session.textContent = Math.floor(workDuration);
        document.querySelector('.seconds').textContent = '00';
        totalSeconds = 0; // Reset timer
        isBreakTime = false; // Reset to work mode
        updateSessionMode(); // Update UI
    }
    
    // Update active state
    document.querySelectorAll('.timer-option').forEach(option => {
        if (option.dataset.timer === timerValue) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Close modal after a short delay for visual feedback
    setTimeout(() => {
        closeTimerModal();
    }, 400);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('timerModal');
    if (event.target === modal) {
        closeTimerModal();
    }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(style);

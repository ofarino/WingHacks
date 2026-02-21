// Remove or comment out the bell sound for now (file doesn't exist)
// const bells = new Audio("./sounds/bell.wav");
const toggleBtn = document.querySelector(".btn-toggle");
const session = document.querySelector(".minutes");
const currentTaskText = document.querySelector(".current-task-text");
let myInterval;
let isRunning = false;
let totalSeconds = 0;
let tasks = [];
let currentTaskIndex = 0;

// Load timer settings and update display
function loadTimerSettings() {
  const timerSettings = localStorage.getItem('timerSettings');
  if (timerSettings) {
    // Parse the work duration from the split (e.g., "25-5" -> 25)
    const workDuration = parseInt(timerSettings.split('-')[0]);
    session.textContent = workDuration;
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

function displayCurrentTask() {
  if (tasks.length > 0 && currentTaskIndex < tasks.length) {
    const task = tasks[currentTaskIndex];
    currentTaskText.textContent = `Current task: ${task.name}`;
  } else {
    currentTaskText.textContent = "Current task: All tasks completed!";
  }
}

function moveToNextTask() {
  currentTaskIndex++;
  tasks.shift(); // Remove the completed task
  localStorage.setItem('studyTasks', JSON.stringify(tasks));
  displayCurrentTask();
}

const toggleTimer = () => {
  if (!isRunning) {
    // Start the timer
    isRunning = true;
    toggleBtn.textContent = "⏸";
    toggleBtn.classList.add("running");
    
    if (totalSeconds === 0) {
      const sessionAmount = Number.parseInt(session.textContent);
      totalSeconds = sessionAmount * 60;
    }
    
    myInterval = setInterval(updateSeconds, 1000);
    
    // Start eye tracking when timer starts
    startEyeTracking();
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
    
    // Stop eye tracking when timer ends
    stopEyeTracking();
    
    // Move to next task when timer completes
    moveToNextTask();
  }
};

toggleBtn.addEventListener("click", toggleTimer);

// Load tasks and timer settings when page loads
loadTimerSettings();
loadTasks();

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
        
        // THE IMPORTANT PART! Check if alert should trigger
        if (data.eyes && data.eyes.alert_triggered) {
            triggerWakeUpAlert(); // YOUR ALERT FUNCTION
        }
        
        // Optional: Show duration on screen
        if (data.eyes && data.eyes.eyes_closed) {
            console.log(`Eyes closed for ${data.eyes.duration} seconds`);
        }
        
    } catch (error) {
        console.error('Failed to check eye status:', error);
    }
}
function triggerWakeUpAlert() {
    console.log('⚠️ WAKE UP! Eyes closed too long!');
    
    // Check if alert already exists
    if (document.getElementById('wake-up-alert')) {
        return; // Don't create duplicate alerts
    }
    
    // Create small red text at bottom
    const alertDiv = document.createElement('div');
    alertDiv.id = 'wake-up-alert';
    alertDiv.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            font-family: 'Blockblueprint', Arial, sans-serif;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
            cursor: pointer;
        " onclick="dismissAlert()">
            ⚠️ Wake up! Your eyes have been closed for too long. Click to dismiss.
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

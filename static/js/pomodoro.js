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

function displayCurrentTask() {
  const taskCompleteBox = document.querySelector('.task-complete-box');
  const taskCheckbox = document.getElementById('taskCheckbox');
  
  if (tasks.length > 0) {
    // Always use the first task (index 0) since we shift completed tasks
    const task = tasks[0];
    currentTaskText.textContent = `Current task: ${task.name}`;
    
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
  
  if (isBreakTime) {
    sessionModeElement.textContent = 'Break Time';
    sessionModeElement.style.color = '#2c3e50';
    // Hide task checkbox during break
    if (taskCompleteBox) {
      taskCompleteBox.style.display = 'none';
    }
  } else {
    sessionModeElement.textContent = 'Work Time';
    sessionModeElement.style.color = '#2c3e50';
    // Show task checkbox during work (if tasks exist)
    if (taskCompleteBox && tasks.length > 0) {
      taskCompleteBox.style.display = 'block';
    }
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
        
        // THE IMPORTANT PART! Check if alert should trigger (but not during breaks)
        if (data.eyes && data.eyes.alert_triggered && !isBreakTime) {
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
            You may not rest now, there's still work to do
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
    alert('Vibe customization coming soon! 🎨\n\nFuture features:\n- Background themes\n- Ambient sounds\n- Color schemes');
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

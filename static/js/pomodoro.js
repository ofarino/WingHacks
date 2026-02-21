const bells = new Audio("./sounds/bell.wav");
const toggleBtn = document.querySelector(".btn-toggle");
const session = document.querySelector(".minutes");
const currentTaskText = document.querySelector(".current-task-text");
let myInterval;
let isRunning = false;
let totalSeconds = 0;
let tasks = [];
let currentTaskIndex = 0;

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
    bells.play();
    clearInterval(myInterval);
    isRunning = false;
    toggleBtn.textContent = "▶";
    toggleBtn.classList.remove("running");
    
    // Move to next task when timer completes
    moveToNextTask();
  }
};

toggleBtn.addEventListener("click", toggleTimer);

// Load tasks when page loads
loadTasks();

async function startEyeTracking() {
    try {
        const response = await fetch('/api/eye-tracking/start', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('Eye tracking started!');
            startStatusPolling(); // Start checking status
        }
    } catch (error) {
        console.error('Failed to start eye tracking:', error);
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
    
    // Option 1: Play a sound
    const audio = new Audio('/static/audio/alert.mp3'); // Add your sound file
    audio.play();
    
    // Option 2: Show a modal/popup
    // showAlertModal();
    
    // Option 3: Shake the screen
    // document.body.classList.add('shake');
    
    // Option 4: Change background color
    // document.body.style.backgroundColor = 'red';
    
    // You can do ALL of these or pick what works best!
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
// When START button is clicked:
startButton.addEventListener('click', () => {
    // Your existing timer start code...
    startPomodoroTimer();
    
    // ADD THIS:
    startEyeTracking();
});

// When timer ends or STOP button clicked:
stopButton.addEventListener('click', () => {
    // Your existing timer stop code...
    stopPomodoroTimer();
    
    // ADD THIS:
    stopEyeTracking();
});

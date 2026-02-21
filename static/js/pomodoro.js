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
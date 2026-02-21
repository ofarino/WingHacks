let tasks = [];

/**
 * 1. Capture user input, add to the array, and sort.
 */
function addTask() {
    const nameInput = document.getElementById('taskName');
    const dateInput = document.getElementById('dueDate');
    const topicInput = document.getElementById('topic');
    const timeInput = parseInt(document.getElementById('expectedTime'));

    const name = nameInput.value;
    const date = dateInput.value;
    const topic = topicInput.value;
    const time = parseInt(timeInput);

    // Validation
    if (!name || !date) {
        alert("Please fill in all fields correctly.");
        return;
    }

    // Add to the data array
    tasks.push({ name, date, topic, time });

    // AUTOMATIC SORTING LOGIC
    // Priority 1: Due Date (Earliest first)
    // Priority 2: Time (Longest first as a tie-breaker)
    tasks.sort((a, b) => {
        if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        return b.time - a.time; 
    });

    renderTasks();

    // Clear inputs for the next entry
    nameInput.value = '';
    dateInput.value = '';
    timeInput = '';
}

/**
 * 2. Draw the tasks into the "Task Box"
 */
function renderTasks() {
    const container = document.getElementById('taskList');
    container.innerHTML = ""; // Remove the "empty" message or old tasks

    tasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.setAttribute('draggable', 'true');
        
        // Use a template literal to structure the task display
        item.innerHTML = `
            <div>
                <strong>${task.name}</strong> <small>(${task.topic})</small><br>
                <span>📅 ${task.date} | ⏳ ${task.time} mins</span>
            </div>
            <button onclick="deleteTask(${index})" style="color:red; border:none; background:none; cursor:pointer;">✖</button>
        `;

        // DRAG EVENTS
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => item.classList.remove('dragging'));

        container.appendChild(item);
    });

    setupDragAndDrop();
}

/**
 * 3. Drag and Drop Logic
 */
function setupDragAndDrop() {
    const container = document.getElementById('taskList');
    
    container.addEventListener('dragover', e => {
        e.preventDefault(); // Required to allow drop
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * 4. Utilities (Delete and Navigate)
 */
function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function goToNextPage() {
    if (tasks.length === 0) {
        alert("Add at least one task before proceeding!");
        return;
    }
    // Save the final order (including manual drags) to localStorage
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    window.location.href = '/pomodoro';
}
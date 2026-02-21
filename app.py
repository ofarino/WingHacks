from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configure Flask app
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Page Routes
@app.route('/')
def landing():
    """Landing page"""
    return render_template('landing.html')

@app.route('/pomodoro')
def pomodoro():
    """Pomodoro timer page"""
    return render_template('pomodoro.html')

@app.route('/tasks')
def tasks():
    """Task management page"""
    return render_template('tasks.html')

# API Routes for task management
@app.route('/api/tasks', methods=['GET', 'POST'])
def api_tasks():
    """Handle task operations"""
    if request.method == 'GET':
        # Get all tasks
        # TODO: Implement task retrieval from database/session
        return jsonify({'tasks': []})
    
    elif request.method == 'POST':
        # Create new task
        data = request.get_json()
        # TODO: Implement task creation
        return jsonify({'success': True, 'task': data})

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def api_task_detail(task_id):
    """Handle individual task operations"""
    if request.method == 'PUT':
        # Update task
        data = request.get_json()
        # TODO: Implement task update
        return jsonify({'success': True, 'task': data})
    
    elif request.method == 'DELETE':
        # Delete task
        # TODO: Implement task deletion
        return jsonify({'success': True})

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('landing.html'), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

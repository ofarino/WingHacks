from flask import Flask, render_template, request, jsonify, Response
import os
from dotenv import load_dotenv
import atexit

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configure Flask app
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Import vision modules (lazy import to avoid errors if packages not installed)
video_stream = None

def get_video_stream():
    """Lazy load video stream"""
    global video_stream
    if video_stream is None:
        try:
            from vision.video_stream import get_video_stream as _get_stream
            video_stream = _get_stream()
            video_stream.start()
        except ImportError as e:
            print(f"Warning: Vision modules not available: {e}")
            return None
    return video_stream

# Cleanup on exit
@atexit.register
def cleanup():
    """Cleanup resources on exit"""
    global video_stream
    if video_stream is not None:
        from vision.video_stream import stop_video_stream
        stop_video_stream()

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

# Eye Tracking API Routes
@app.route('/api/eye-tracking/start', methods=['POST'])
def start_eye_tracking():
    """Start eye tracking"""
    try:
        stream = get_video_stream()
        if stream is None:
            return jsonify({
                'success': False,
                'error': 'Eye tracking not available. Please install required packages.'
            }), 503
        
        stream.reset_tracking()
        return jsonify({
            'success': True,
            'message': 'Eye tracking started'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/eye-tracking/stop', methods=['POST'])
def stop_eye_tracking():
    """Stop eye tracking"""
    try:
        global video_stream
        if video_stream is not None:
            from vision.video_stream import stop_video_stream
            stop_video_stream()
            video_stream = None
        
        return jsonify({
            'success': True,
            'message': 'Eye tracking stopped'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/eye-tracking/status', methods=['GET'])
def eye_tracking_status():
    """Get current eye tracking status"""
    try:
        stream = get_video_stream()
        if stream is None:
            return jsonify({
                'success': False,
                'camera_active': False,
                'error': 'Eye tracking not available'
            })
        
        status = stream.get_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/eye-tracking/reset', methods=['POST'])
def reset_eye_tracking():
    """Reset eye tracking state"""
    try:
        stream = get_video_stream()
        if stream is None:
            return jsonify({
                'success': False,
                'error': 'Eye tracking not available'
            }), 503
        
        stream.reset_tracking()
        return jsonify({
            'success': True,
            'message': 'Eye tracking state reset'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('landing.html'), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

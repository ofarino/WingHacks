#!/bin/bash
# This automatically activates the virtual environment and runs the app

echo "🚀 Starting MindCraft..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found."
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Flask not installed. Installing dependencies..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if models are downloaded
if [ ! -f "vision/models/face_landmarker.task" ] || [ ! -f "vision/models/hand_landmarker.task" ]; then
    echo "⚠️  Models not found."
    echo "Downloading eye tracking and gesture detection models..."
    python3 setup_models.py
    echo ""
fi

# Set environment variable for camera permissions
export OPENCV_AVFOUNDATION_SKIP_AUTH=1

# Start the app
echo "✓ Starting Flask app..."
echo ""
python3 app.py

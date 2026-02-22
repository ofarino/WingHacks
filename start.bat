@echo off
REM MindCraft - Easy Start Script for Windows
REM This automatically activates the virtual environment and runs the app

echo Starting MindCraft...
echo.

REM Check if venv exists
if not exist "venv\" (
    echo Virtual environment not found.
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
    echo.
)

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if Flask is installed
python -c "import flask" 2>nul
if errorlevel 1 (
    echo Flask not installed. Installing dependencies...
    pip install -r requirements.txt
    echo Dependencies installed
    echo.
)

REM Check if models are downloaded
if not exist "vision\models\face_landmarker.task" (
    echo Models not found.
    echo Downloading eye tracking and gesture detection models...
    python setup_models.py
    echo.
) else if not exist "vision\models\hand_landmarker.task" (
    echo Hand gesture model not found.
    echo Downloading models...
    python setup_models.py
    echo.
)

REM Start the app
echo Starting Flask app...
echo.
python app.py

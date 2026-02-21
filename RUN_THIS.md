# 🚀 How to Run on Any Laptop

## The Easy Way (Recommended)

### macOS / Linux:
```bash
./start.sh
```

### Windows:
```bash
start.bat
```

That's it! The script will:
1. ✅ Create virtual environment (if needed)
2. ✅ Install all dependencies (if needed)
3. ✅ Download eye tracking models (if needed)
4. ✅ Start the Flask app

Then open: **http://localhost:5001**

---

## The Manual Way

If the scripts don't work, follow these steps:

### Step 1: Create Virtual Environment
```bash
python3 -m venv venv
```

### Step 2: Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Download Models
```bash
python setup_models.py
```

### Step 5: Run the App
```bash
python app.py
```

Open: **http://localhost:5001**

---

## ⚠️ Important: Virtual Environment

**Always activate the virtual environment before running the app!**

If you see "ModuleNotFoundError: No module named 'flask'", it means:
- You forgot to activate the venv
- OR you need to install dependencies

**Solution:**
```bash
# Activate venv first!
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Then run
python app.py
```

---

## 📦 What Gets Installed (in venv)

- Flask 3.0.0
- opencv-python 4.8.0+
- mediapipe 0.10.30+
- numpy 1.26.0+
- Other dependencies

**Total size:** ~150MB (only in the venv folder, not system-wide)

---

## 🔄 Sharing With Others

When you share this project:

1. **Don't include the `venv` folder** (it's huge and system-specific)
2. **Do include:**
   - All `.py` files
   - `requirements.txt`
   - `static/`, `templates/`, `vision/` folders
   - `start.sh` and `start.bat` scripts

3. **Tell them to:**
   - Run `./start.sh` (macOS/Linux) or `start.bat` (Windows)
   - OR follow the manual steps above

---

## 🐛 Troubleshooting

### "python3: command not found"
Try `python` instead of `python3`

### "Permission denied: ./start.sh"
Run: `chmod +x start.sh`

### "Flask not found" even after installing
Make sure venv is activated! You should see `(venv)` in your terminal prompt.

### Port 5001 already in use
```bash
# Kill old process
lsof -ti:5001 | xargs kill -9  # macOS/Linux
```

### Models not downloading
Run manually: `python setup_models.py`

---

## ✅ Quick Test

After setup, test that everything works:

```bash
# 1. Activate venv
source venv/bin/activate

# 2. Test Flask
python -c "import flask; print('Flask OK')"

# 3. Test OpenCV
python -c "import cv2; print('OpenCV OK')"

# 4. Test MediaPipe
python -c "import mediapipe; print('MediaPipe OK')"

# 5. Check models
ls vision/models/
# Should show: face_landmarker.task and face_detector.tflite
```

If all tests pass, you're ready! 🎉

---

## 🎯 For Hackathon Judges / Testers

**Easiest way to test:**

1. Clone/download this repo
2. Run `./start.sh` (or `start.bat` on Windows)
3. Open http://localhost:5001
4. Go to Pomodoro page and click play
5. Close your eyes for 10 seconds → alert appears!

**No manual setup needed** - the script does everything automatically!

---

**Need help? Check QUICK_START.md for detailed troubleshooting.**

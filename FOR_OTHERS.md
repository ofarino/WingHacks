# ⚡ SUPER QUICK START

## For People Using Your Laptop

Just run this ONE command:

### macOS / Linux:
```bash
./start.sh
```

### Windows:
```bash
start.bat
```

Then open: **http://localhost:5001**

✅ **That's literally it!** The script handles everything automatically.

---

## For People Using Their Own Laptop

They need to do this ONCE (first time only):

```bash
# 1. Install Python packages
pip install -r requirements.txt

# 2. Download eye tracking models
python setup_models.py
```

Then every time they want to run it:
```bash
./start.sh   # macOS/Linux
start.bat    # Windows
```

---

## Why Do They Need To Install?

Each laptop needs:
1. **Python packages** - Flask, OpenCV, MediaPipe (installed in a virtual environment)
2. **Eye tracking models** - 2 small files (~4MB) that detect faces and eyes

**The virtual environment (`venv` folder) is not shared** - it's computer-specific!

---

## What to Share

Share the whole project EXCEPT the `venv` folder (it's huge and won't work on other computers anyway).

You can add this to `.gitignore`:
```
venv/
vision/models/*.task
vision/models/*.tflite
__pycache__/
*.pyc
.env
```

Then they download models automatically when they run `setup_models.py` or `start.sh`

---

## Quick Checklist for Others

- [ ] I have Python 3.8+ installed
- [ ] I ran `pip install -r requirements.txt`
- [ ] I ran `python setup_models.py`
- [ ] I ran `./start.sh` (or `start.bat`)
- [ ] I opened http://localhost:5001
- [ ] It works! 🎉

---

**The `start.sh` script is smart** - it will automatically:
- Create venv if missing
- Install packages if missing
- Download models if missing
- Then start the app

So you can literally just tell people: **"Run ./start.sh and open localhost:5001"**

That's it! 🚀

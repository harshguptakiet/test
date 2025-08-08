@echo off
echo 🚀 Starting CuraGenie Backend...
cd /d C:\Users\xhgme\curagenie-cleaned\backend
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated
echo 🔄 Starting FastAPI server on http://localhost:8000
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause

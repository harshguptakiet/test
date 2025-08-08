@echo off
echo 🧠 CuraGenie - Starting Local Development Environment
echo.
echo This will start both:
echo   📱 Frontend (Next.js) on http://localhost:3000
echo   🛠️  Backend (FastAPI) on http://localhost:8000
echo.
echo Opening backend in new window...
start "CuraGenie Backend" "%~dp0start-backend.bat"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo Opening frontend in new window...
start "CuraGenie Frontend" "%~dp0start-frontend.bat"

echo.
echo ✅ Both services are starting!
echo.
echo 📚 API Documentation: http://localhost:8000/docs
echo 🌐 Frontend Application: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

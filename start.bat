@echo off
title TripGenie AI Launcher
echo ============================================================
echo           TripGenie AI - Starting Local Dev Servers
echo ============================================================
echo.

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start "TripGenie Backend (FastAPI - Port 8000)" cmd /k "cd /d %~dp0Backend && .\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching React Frontend on http://localhost:5173...
start "TripGenie Frontend (Vite - Port 5173)" cmd /k "cd /d %~dp0Frontend && npm run dev"

echo.
echo ============================================================
echo Both servers have been launched in separate windows!
echo - Backend:  http://localhost:8000/api/health
echo - Frontend: http://localhost:5173
echo.
echo Opening TripGenie AI in your default browser...
start http://localhost:5173
echo ============================================================
pause


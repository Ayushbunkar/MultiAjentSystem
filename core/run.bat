@echo off
REM Multi-Agent Research System - FastAPI Server Launcher
REM This script starts the FastAPI web server

echo.
echo =====================================
echo Multi-Agent Research System
echo =====================================
echo.

REM Check if .venv exists
if not exist ".venv" (
    echo Error: Virtual environment not found!
    echo Please ensure you have installed dependencies with: uv pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment and start FastAPI
echo Starting FastAPI server...
echo.

call .venv\Scripts\activate.bat && python app.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error starting FastAPI server!
    echo Make sure all dependencies are installed: uv pip install -r requirements.txt
    pause
)

#!/usr/bin/env pwsh
# Multi-Agent Research System - FastAPI Server Launcher
# This script starts the FastAPI web server

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Multi-Agent Research System" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path ".venv")) {
    Write-Host "Error: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please ensure you have installed dependencies with:" -ForegroundColor Yellow
    Write-Host "uv pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment
& ".venv/Scripts/Activate.ps1"

# Start FastAPI app
if ($?) {
    python app.py
} else {
    Write-Host "Error: Failed to activate virtual environment!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Starts the professor-agent API on http://127.0.0.1:8000 (no auto-reload).
param([int]$Port = 8000)

$venv = Join-Path $env:USERPROFILE ".venvs\yale-som-virtual"
if (-not (Test-Path "$venv\Scripts\python.exe")) { throw "Run .\setup.ps1 first." }
Set-Location $PSScriptRoot
& "$venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port $Port

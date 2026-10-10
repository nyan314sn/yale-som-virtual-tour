# Creates the backend's virtual environment OUTSIDE OneDrive and installs requirements.
# Why outside: pydantic-ai ships deeply nested files that exceed Windows' 260-character path
# limit under a long OneDrive path, and AGENTS.md asks to keep .venv out of cloud sync anyway.
param([string]$Python = "python")

$venv = Join-Path $env:USERPROFILE ".venvs\yale-som-virtual"
if (-not (Test-Path "$venv\Scripts\python.exe")) {
    & $Python -m venv $venv
    if (-not $?) { throw "Could not create venv with '$Python'. Pass -Python <path to python.exe>." }
}
& "$venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r "$PSScriptRoot\requirements.txt"
if ($?) { Write-Host "Backend environment ready: $venv" }

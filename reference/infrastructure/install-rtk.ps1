# RTK (Rust Token Killer) Installation Script for Windows
# Reduces LLM token consumption by 60-90%
# Supports Google Antigravity natively

param(
    [switch]$ForceReinstall
)

$ErrorActionPreference = "Stop"
$RtkVersion = "0.28.2"
$RtkUrl = "https://github.com/rtk-ai/rtk/releases/latest/download/rtk-x86_64-pc-windows-msvc.zip"
$InstallDir = "$env:USERPROFILE\.local\bin"
$ZipPath = "$env:TEMP\rtk-windows.zip"
$RtkExe = "$InstallDir\rtk.exe"

Write-Host "=== RTK (Rust Token Killer) Installer ===" -ForegroundColor Cyan
Write-Host "Target: 60-90% LLM token savings" -ForegroundColor Yellow

# Check if already installed
if ((Test-Path $RtkExe) -and -not $ForceReinstall) {
    $version = & $RtkExe --version 2>&1
    Write-Host "RTK already installed: $version" -ForegroundColor Green
    Write-Host "Run 'rtk init --agent antigravity' to activate for this project." -ForegroundColor Cyan
    Read-Host "`nPress Enter to exit..."
    exit 0
}

# Create install directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "Created $InstallDir" -ForegroundColor Gray
}

# Download RTK
Write-Host "Downloading RTK v$RtkVersion..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $RtkUrl -OutFile $ZipPath -UseBasicParsing
} catch {
    Write-Host "Download failed. Try manually:" -ForegroundColor Red
    Write-Host "  https://github.com/rtk-ai/rtk/releases" -ForegroundColor Yellow
    exit 1
}

# Extract
Write-Host "Extracting..." -ForegroundColor Cyan
Expand-Archive -Path $ZipPath -DestinationPath "$env:TEMP\rtk-extract" -Force
Copy-Item "$env:TEMP\rtk-extract\rtk.exe" -Destination $RtkExe -Force

# Cleanup
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\rtk-extract" -Recurse -Force -ErrorAction SilentlyContinue

# Verify
$version = & $RtkExe --version 2>&1
Write-Host "`nRTK installed successfully: $version" -ForegroundColor Green

# Check PATH
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$InstallDir", "User")
    Write-Host "Added $InstallDir to PATH (restart terminal to take effect)" -ForegroundColor Yellow
} else {
    Write-Host "$InstallDir already in PATH" -ForegroundColor Gray
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart your terminal" -ForegroundColor White
Write-Host "2. Run: rtk init --agent antigravity" -ForegroundColor White
Write-Host "   (in directory: d:\APP\prossnum)" -ForegroundColor Gray
Write-Host "3. Restart Antigravity - RTK will auto-compress CLI output" -ForegroundColor White
Write-Host "`nOn Windows, RTK uses CLAUDE.md injection mode (hook unavailable)" -ForegroundColor Yellow
Write-Host "Use explicit commands: rtk git status, rtk pytest, rtk next build" -ForegroundColor Yellow

Read-Host "`nPress Enter to exit..."

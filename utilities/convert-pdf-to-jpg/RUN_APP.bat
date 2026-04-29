@echo off
echo === Starting PDF to JPG Converter ===
echo.

python pdf_to_jpg_converter.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Failed to start application
    echo.
    echo Possible solutions:
    echo 1. Run TEST_ONLY.bat to check dependencies
    echo 2. Run QUICK_INSTALL.bat to install missing packages
    echo 3. Check that Python is properly installed
)

echo.
pause

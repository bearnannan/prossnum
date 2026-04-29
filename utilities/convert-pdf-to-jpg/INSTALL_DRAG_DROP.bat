@echo off
echo === Installing Drag & Drop Support ===
echo.

echo Installing tkinterdnd2 for Drag & Drop functionality...
py -m pip install tkinterdnd2

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Drag & Drop support installed successfully!
    echo.
    echo You can now:
    echo 1. Run the converter with Drag & Drop: python pdf_to_jpg_converter.py
    echo 2. Build executable with Drag & Drop: python build_exe.py
    echo.
    echo Features added:
    echo - Drag PDF files directly into the application
    echo - Drop multiple files at once
    echo - Visual feedback during drag operations
) else (
    echo.
    echo ❌ Failed to install tkinterdnd2
    echo.
    echo Alternative installation methods:
    echo 1. Try: py -m pip install --user tkinterdnd2
    echo 2. Try: pip install tkinterdnd2
    echo 3. Download from: https://pypi.org/project/tkinterdnd2/
)

echo.
pause

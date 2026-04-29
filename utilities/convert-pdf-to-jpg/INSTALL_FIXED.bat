@echo off
echo === PDF to JPG Converter Installation (Fixed) ===
echo.

echo Upgrading pip first...
py -m pip install --upgrade pip

echo.
echo Installing compatible packages...
py -m pip install "Pillow>=10.2.0" "PyMuPDF>=1.23.26" "PyInstaller>=6.2.0"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Standard installation failed. Trying alternative approach...
    echo.
    echo Installing without version constraints...
    py -m pip install Pillow PyMuPDF PyInstaller
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Still failing. Trying pre-built wheels...
    py -m pip install --only-binary=all Pillow PyMuPDF PyInstaller
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Installation completed successfully!
    echo.
    echo You can now:
    echo 1. Run the converter: python pdf_to_jpg_converter.py
    echo 2. Build executable: python build_exe.py
    echo 3. Test installation: python test_converter.py
) else (
    echo.
    echo ❌ Installation failed. Please try manual installation:
    echo.
    echo py -m pip install --upgrade pip
    echo py -m pip install Pillow PyMuPDF PyInstaller
    echo.
    echo If that fails, try installing Visual C++ Build Tools:
    echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
)

echo.
pause

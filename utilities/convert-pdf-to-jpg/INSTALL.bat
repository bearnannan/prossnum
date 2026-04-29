@echo off
echo === PDF to JPG Converter Installation ===
echo.

echo Installing required packages...
py -m pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Installation failed. Trying alternative method...
    echo.
    py -m pip install Pillow PyMuPDF PyInstaller
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
    echo ❌ Installation failed. Please check your Python installation.
    echo Make sure Python and pip are properly installed and accessible.
)

echo.
pause

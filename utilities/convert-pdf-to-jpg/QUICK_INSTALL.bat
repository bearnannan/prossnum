@echo off
echo === Quick Install for PDF to JPG Converter ===
echo.

echo This script will install the required packages with multiple fallback methods.
echo.

echo Step 1: Upgrading pip...
py -m pip install --upgrade pip

echo.
echo Step 2: Installing packages (Method 1 - Latest versions)...
py -m pip install Pillow PyMuPDF PyInstaller

if %ERRORLEVEL% EQU 0 goto SUCCESS

echo.
echo Step 3: Installing packages (Method 2 - Pre-built wheels only)...
py -m pip install --only-binary=all Pillow PyMuPDF PyInstaller

if %ERRORLEVEL% EQU 0 goto SUCCESS

echo.
echo Step 4: Installing packages (Method 3 - Without version constraints)...
py -m pip install --no-cache-dir Pillow PyMuPDF PyInstaller

if %ERRORLEVEL% EQU 0 goto SUCCESS

echo.
echo ❌ All installation methods failed.
echo.
echo Possible solutions:
echo 1. Install Visual C++ Build Tools from Microsoft
echo 2. Use a different Python version (3.9-3.11 recommended)
echo 3. Try installing from conda: conda install pillow pymupdf pyinstaller
echo.
goto END

:SUCCESS
echo.
echo ✅ Installation successful!
echo.
echo You can now run:
echo - python pdf_to_jpg_converter.py (to test the app)
echo - python build_exe.py (to build the executable)

:END
echo.
pause

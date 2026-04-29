@echo off
echo === Building PDF to JPG Converter Executable ===
echo.

echo Checking if dependencies are available...
python -c "import PIL, fitz, PyInstaller" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Dependencies not found. Running installation first...
    call QUICK_INSTALL.bat
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Cannot build executable. Installation failed.
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies are available
)

echo.
echo Testing GUI creation...
python -c "from pdf_to_jpg_converter import PDFToJPGConverter; app = PDFToJPGConverter(); app.root.destroy(); print('GUI test passed')"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ GUI test failed. Please check the application code.
    pause
    exit /b 1
)

echo.
echo Building executable...
python build_exe.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Build completed successfully!
    echo.
    echo Your executable is ready in:
    echo - PDF_to_JPG_Converter_Portable\PDF_to_JPG_Converter.exe
    echo.
    echo You can distribute this folder to other users.
) else (
    echo.
    echo ❌ Build failed. Please check the error messages above.
)

echo.
pause

@echo off
echo === Testing PDF to JPG Converter ===
echo.

echo Testing imports...
python -c "import PIL, fitz, PyInstaller; print('✓ All imports successful')"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Import test failed
    goto END
)

echo.
echo Testing GUI creation...
python -c "from pdf_to_jpg_converter import PDFToJPGConverter; app = PDFToJPGConverter(); app.root.destroy(); print('✓ GUI created successfully')"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ GUI test failed
    goto END
)

echo.
echo ✓ All tests passed!
echo You can now run: python pdf_to_jpg_converter.py

:END
echo.
pause

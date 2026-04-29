# PDF to JPG Converter

A Python desktop application that converts PDF files to JPG images with a user-friendly GUI. The application can be packaged as a standalone .exe executable for Windows.

## Features

- **Graphical User Interface**: Easy-to-use Tkinter-based interface
- **High-Quality Conversion**: Adjustable DPI (72-600) and JPG quality (10-100)
- **Batch Processing**: Converts all pages of a PDF in one go
- **Progress Tracking**: Real-time progress bar during conversion
- **Smart Defaults**: Auto-detects PDF location for output folder
- **Portable Executable**: Can be packaged as standalone .exe file

## Requirements

### For Development
- Python 3.7 or higher
- Required packages (see requirements.txt):
  - Pillow (PIL) - Image processing
  - PyMuPDF - PDF rendering
  - PyInstaller - Executable packaging

### For Executable
- Windows 10 or later
- No additional dependencies (standalone executable)

## Installation

### Option 1: Run from Source
1. Clone or download this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python pdf_to_jpg_converter.py
   ```

### Option 2: Build Executable
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the build script:
   ```bash
   python build_exe.py
   ```
3. Find the executable in the `PDF_to_JPG_Converter_Portable` folder

## Usage

1. **Select PDF File**: Click "Browse" to choose a PDF file
2. **Choose Output Folder**: Select where to save the JPG files (defaults to PDF's location)
3. **Adjust Settings**: 
   - DPI: Higher values mean better quality but larger files
   - JPG Quality: Compression level (10-100)
4. **Convert**: Click "Convert PDF to JPG" to start the process
5. **View Results**: Check the output folder for converted images

## File Structure

```
convert PDF to JPG/
├── pdf_to_jpg_converter.py    # Main application
├── requirements.txt           # Python dependencies
├── build_exe.py              # Build script for executable
├── README.md                 # This file
├── dist/                     # PyInstaller output
└── PDF_to_JPG_Converter_Portable/  # Final distributable folder
```

## Technical Details

### Libraries Used
- **PyMuPDF (fitz)**: High-performance PDF rendering and image extraction
- **Pillow (PIL)**: Image processing and format conversion
- **tkinter**: GUI framework (included with Python)
- **PyInstaller**: Packaging Python applications into standalone executables

### Conversion Process
1. Opens PDF using PyMuPDF
2. Renders each page as an image with specified DPI
3. Converts to PIL Image format
4. Saves as JPG with specified quality settings
5. Updates progress bar in real-time

### Naming Convention
Output files are named: `{PDF_name}_page_001.jpg`, `{PDF_name}_page_002.jpg`, etc.

## Building the Executable

The build script (`build_exe.py`) automates the entire process:

1. **Installs Dependencies**: Ensures all required packages are installed
2. **Builds Executable**: Uses PyInstaller with optimized settings
3. **Creates Distribution Folder**: Packages the executable with documentation

### PyInstaller Options Used
- `--onefile`: Creates single executable file
- `--windowed`: Hides console window for GUI application
- `--clean`: Removes temporary files
- `--noconfirm`: Overwrites existing builds

## Troubleshooting

### Common Issues

1. **"PDF file does not exist"**: Ensure the PDF file path is correct and accessible
2. **"Permission denied"**: Check write permissions for the output folder
3. **"Out of memory"**: Try reducing the DPI setting for large PDFs
4. **Executable doesn't start**: Ensure all dependencies were properly packaged

### Performance Tips
- Use lower DPI (150-200) for faster conversion when quality isn't critical
- Close other applications when converting large PDFs
- Ensure sufficient disk space for output images

## License

This project is provided as-is for educational and personal use.

## Contributing

Feel free to submit issues or enhancement requests!

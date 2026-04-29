#!/usr/bin/env python3
"""
Build script to create PDF to JPG converter executable
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    
    # First upgrade pip
    try:
        print("Upgrading pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    except subprocess.CalledProcessError:
        print("Warning: Could not upgrade pip")
    
    # Try installing from requirements.txt
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install from requirements.txt: {e}")
        
        # Try installing without version constraints
        try:
            print("Trying installation without version constraints...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "PyMuPDF", "PyInstaller"])
            print("✓ Requirements installed successfully")
            return True
        except subprocess.CalledProcessError as e2:
            print(f"✗ Failed to install packages: {e2}")
            
            # Try installing pre-built wheels only
            try:
                print("Trying pre-built wheels only...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--only-binary=all", "Pillow", "PyMuPDF", "PyInstaller"])
                print("✓ Requirements installed successfully")
                return True
            except subprocess.CalledProcessError as e3:
                print(f"✗ All installation methods failed: {e3}")
                return False


def build_executable():
    """Build the executable using PyInstaller"""
    print("Building executable...")
    
    # PyInstaller options
    options = [
        "--onefile",                    # Create single executable
        "--windowed",                   # Hide console window
        "--name=PDF_to_JPG_Converter", # Name of the executable
        "--icon=icon.ico",              # Icon file (if exists)
        "--add-data=icon.ico;.",       # Include icon file
        "--collect-data=tkinterdnd2",   # Collect TkinterDnD2 tkdnd package files
        "--clean",                      # Clean temporary files
        "--noconfirm",                  # Overwrite existing files
        "pdf_to_jpg_converter.py"       # Main script
    ]
    
    # Remove icon options if icon doesn't exist
    if not os.path.exists("icon.ico"):
        options = [opt for opt in options if "icon" not in opt]
    
    try:
        cmd = [sys.executable, "-m", "PyInstaller"] + options
        subprocess.check_call(cmd)
        print("✓ Executable built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to build executable: {e}")
        return False


def create_installer_folder():
    """Create a folder with the executable and necessary files"""
    print("Creating distribution folder...")
    
    dist_dir = Path("dist")
    installer_dir = Path("PDF_to_JPG_Converter_Portable")
    
    # Remove existing installer directory
    if installer_dir.exists():
        shutil.rmtree(installer_dir)
    
    # Create new installer directory
    installer_dir.mkdir(exist_ok=True)
    
    # Copy executable
    exe_path = dist_dir / "PDF_to_JPG_Converter.exe" if os.name == 'nt' else dist_dir / "PDF_to_JPG_Converter"
    if exe_path.exists():
        shutil.copy2(exe_path, installer_dir)
        print(f"✓ Executable copied to {installer_dir}")
    else:
        print(f"✗ Executable not found at {exe_path}")
        return False
    
    # Create README
    readme_content = """# PDF to JPG Converter

A simple desktop application to convert PDF files to JPG images.

## Features

- Convert PDF pages to high-quality JPG images
- Adjustable DPI and quality settings
- User-friendly graphical interface
- Batch conversion of all pages
- Progress tracking

## How to Use

1. Double-click `PDF_to_JPG_Converter.exe` to start the application
2. Click "Browse" to select a PDF file
3. Choose an output folder (defaults to PDF's location)
4. Adjust DPI and quality settings if needed
5. Click "Convert PDF to JPG" to start conversion
6. View the converted JPG files in the output folder

## Requirements

- Windows 10 or later
- No additional software required (portable application)

## Technical Details

- Built with Python, PyMuPDF, and Pillow
- Standalone executable - no installation needed
- Supports all standard PDF files

## Support

For issues or questions, please refer to the source code repository.
"""
    
    with open(installer_dir / "README.txt", "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    print("✓ README.txt created")
    return True


def main():
    """Main build process"""
    print("=== PDF to JPG Converter Build Script ===\n")
    
    # Check if we're in the right directory
    if not os.path.exists("pdf_to_jpg_converter.py"):
        print("✗ Error: pdf_to_jpg_converter.py not found in current directory")
        print("Please run this script from the project directory")
        return False
    
    # Step 1: Install requirements
    if not install_requirements():
        return False
    
    print()
    
    # Step 2: Build executable
    if not build_executable():
        return False
    
    print()
    
    # Step 3: Create installer folder
    if not create_installer_folder():
        return False
    
    print("\n=== Build Complete ===")
    print("✓ Executable created successfully!")
    print(f"✓ Distribution folder created: PDF_to_JPG_Converter_Portable")
    print("\nYou can now:")
    print("1. Test the executable in the 'dist' folder")
    print("2. Distribute the contents of 'PDF_to_JPG_Converter_Portable' folder")
    
    return True


if __name__ == "__main__":
    success = main()
    if not success:
        print("\nBuild failed. Please check the error messages above.")
        sys.exit(1)
    else:
        print("\nBuild completed successfully!")
        input("Press Enter to exit...")

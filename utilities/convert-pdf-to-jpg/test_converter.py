#!/usr/bin/env python3
"""
Test script to verify PDF to JPG converter functionality
"""

import sys
import os

def test_imports():
    """Test if required packages can be imported"""
    print("Testing imports...")
    
    try:
        import tkinter as tk
        print("✓ tkinter imported successfully")
    except ImportError as e:
        print(f"✗ tkinter import failed: {e}")
        return False
    
    try:
        from PIL import Image
        print("✓ Pillow imported successfully")
    except ImportError as e:
        print(f"✗ Pillow import failed: {e}")
        print("  Install with: pip install Pillow")
        return False
    
    try:
        import fitz
        print("✓ PyMuPDF imported successfully")
    except ImportError as e:
        print(f"✗ PyMuPDF import failed: {e}")
        print("  Install with: pip install PyMuPDF")
        return False
    
    return True

def test_gui_creation():
    """Test if GUI can be created without showing"""
    print("\nTesting GUI creation...")
    
    try:
        # Import the converter class
        from pdf_to_jpg_converter import PDFToJPGConverter
        
        # Create instance but don't run mainloop
        app = PDFToJPGConverter()
        print("✓ GUI created successfully")
        
        # Test that all widgets exist (updated for multiple files)
        assert hasattr(app, 'pdf_files')
        assert hasattr(app, 'output_folder')
        assert hasattr(app, 'dpi')
        assert hasattr(app, 'quality')
        assert hasattr(app, 'progress_bar')
        assert hasattr(app, 'status_label')
        assert hasattr(app, 'pdf_listbox')
        assert hasattr(app, 'current_file_var')
        print("✓ All GUI components initialized")
        
        # Destroy the window
        app.root.destroy()
        return True
        
    except Exception as e:
        print(f"✗ GUI creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=== PDF to JPG Converter Test Suite ===\n")
    
    # Test 1: Imports
    if not test_imports():
        print("\n❌ Import tests failed. Please install missing dependencies.")
        return False
    
    # Test 2: GUI Creation
    if not test_gui_creation():
        print("\n❌ GUI tests failed.")
        return False
    
    print("\n✅ All tests passed!")
    print("The converter is ready to use.")
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\nPlease run the following commands to install dependencies:")
        print("pip install -r requirements.txt")
        print("\nOr install manually:")
        print("pip install Pillow PyMuPDF PyInstaller")
        sys.exit(1)
    else:
        print("\nYou can now run the converter with:")
        print("python pdf_to_jpg_converter.py")
        input("\nPress Enter to exit...")

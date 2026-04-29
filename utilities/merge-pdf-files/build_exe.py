import os
import subprocess
import sys

def build_exe():
    """Build PDF Merger as executable using PyInstaller"""
    
    print("Building PDF Merger executable...")
    
    # Install requirements first
    print("Installing requirements...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Build executable
    print("Building executable with PyInstaller...")
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",           # Create single executable file
        "--windowed",          # Don't show console window
        "--name=PDFMerger",    # Name of the executable
        "--icon=icon.ico",     # Icon file (if exists)
        "--add-data=README.md;.",  # Include README
        "--collect-all=tkinterdnd2", # Crucial for bundling tkdnd binaries
        "pdf_merger.py"
    ]
    
    # Remove icon option if icon file doesn't exist
    if not os.path.exists("icon.ico"):
        cmd = [c for c in cmd if not c.startswith("--icon")]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Build successful!")
        print(f"Executable created in: dist/PDFMerger.exe")
        
        # Move executable to current directory
        if os.path.exists("dist/PDFMerger.exe"):
            import shutil
            shutil.move("dist/PDFMerger.exe", "PDFMerger.exe")
            print("Executable moved to current directory: PDFMerger.exe")
            
    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        print(f"Error output: {e.stderr}")
        return False
    
    return True

if __name__ == "__main__":
    if build_exe():
        print("\nBuild completed successfully!")
        print("You can now run PDFMerger.exe")
    else:
        print("\nBuild failed. Please check the error messages above.")

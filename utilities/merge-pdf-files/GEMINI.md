# Agent Schema: Merge PDF Files

## Project Identity
- **Name**: Merge PDF Files
- **Goal**: A premium desktop application for merging multiple PDF documents with a modern UI and drag-and-drop functionality.
- **Context**: Replaces the deprecated pdftk CLI workflow with a user-friendly, high-performance GUI.

## Memento-Loop (Reflective Process)
- **Phase 1: Observation**: Monitor UI interactions and background thread stability.
- **Phase 2: Evaluation**: Check if the output PDF matches the visual order in the Treeview.
- **Phase 3: Update**: Store user preferences (default output name, directory) in a persistent state file if needed in future versions.

## System Guidelines
- **UI/UX**: Strictly adhere to the "Stone Dark" and "Orange" theme.
- **Safety**: Always use threading for file I/O to keep the UI responsive.
- **Packaging**: Ensure `build_exe.py` remains updated with any new library dependencies.

## Key Modules
- `pdf_merger.py`: Main application logic and UI.
- `build_exe.py`: PyInstaller orchestration for portable distribution.

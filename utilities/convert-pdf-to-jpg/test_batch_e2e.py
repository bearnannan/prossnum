import io, os, sys, traceback
from pathlib import Path
import pytest
from PIL import Image
import fitz
import tkinter as tk

# Ensure the module can be imported
sys.path.insert(0, str(Path(__file__).parent))
from batch_processor import BatchProcessor

# ── Minimal mock of PDFToJPGConverter settings ────────────────────────────────
class MockVar:
    """Minimal tk.IntVar / tk.StringVar / tk.BooleanVar replacement."""
    def __init__(self, value): self._v = value
    def get(self): return self._v
    def set(self, v): self._v = v

class MockApp:
    dpi              = MockVar(150)          # moderate DPI for speed
    quality          = MockVar(85)
    output_format    = MockVar("JPG")
    png_compression  = MockVar(6)
    webp_quality     = MockVar(80)
    webp_method      = MockVar(4)
    output_folder    = MockVar("")

    def generate_filename(self, pdf_path, page_num):
        stem = Path(pdf_path).stem
        return f"{stem}_page_{page_num:03d}.jpg"

@pytest.fixture(scope="session")
def tk_root():
    """Provides a hidden Tk root for tk.Variables used by BatchProcessor."""
    root = tk.Tk()
    root.withdraw()
    yield root
    try:
        root.destroy()
    except Exception:
        pass

@pytest.fixture
def temp_pdf(tmp_path):
    """Creates a minimal 1-page PDF for testing."""
    pdf_path = tmp_path / "test_input.pdf"
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)        # A4
    page.insert_text((72, 100), "PDF to JPG — E2E test page", fontsize=24)
    page.insert_text((72, 150), "BatchProcessor.process_single_file()", fontsize=14)
    doc.save(str(pdf_path))
    doc.close()
    return str(pdf_path)

@pytest.fixture
def mock_app(tmp_path):
    app = MockApp()
    app.output_folder.set(str(tmp_path))
    return app

def test_process_single_file(tk_root, temp_pdf, mock_app):
    """Test standard single file processing with callbacks."""
    processor = BatchProcessor(mock_app)

    pages_seen = []
    def page_cb(cur, total, out_path):
        pages_seen.append((cur, total, out_path))

    converted = processor.process_single_file(
        temp_pdf,
        file_index=(0, 1),
        page_callback=page_cb
    )

    assert isinstance(converted, list), "process_single_file must return a list"
    assert len(converted) == 1, f"Expected 1 page, got {len(converted)}"
    assert len(pages_seen) == 1, f"page_callback called {len(pages_seen)} times, expected 1"

    out_path = converted[0]
    assert os.path.exists(out_path), f"Output file missing: {out_path}"

    with Image.open(out_path) as img:
        w, h = img.size
        assert w > 0 and h > 0, "Output image has zero dimensions"

def test_process_single_file_safe(tk_root, temp_pdf, mock_app):
    """Test parallel-safe wrapper."""
    processor = BatchProcessor(mock_app)
    
    result = processor.process_single_file_safe(temp_pdf)
    assert result['success'], f"Safe wrapper failed: {result}"
    assert len(result['converted']) == 1

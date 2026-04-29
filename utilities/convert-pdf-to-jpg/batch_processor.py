#!/usr/bin/env python3
"""
Advanced Batch Processing Module for PDF to JPG Converter
Provides advanced features for processing multiple PDF files efficiently
"""

import io
import os
import json
import time
import threading
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image
import fitz  # PyMuPDF

# Optional drag-and-drop support (tkinterdnd2)
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    _DND_AVAILABLE = True
except ImportError:
    _DND_AVAILABLE = False
    print("[WARN] tkinterdnd2 not found — drag-and-drop disabled")

class BatchProcessor:
    def __init__(self, main_app):
        self.main_app = main_app
        self.batch_queue = []
        self.processing = False
        self.current_batch = None
        self.batch_history = []
        
        # Batch settings
        self.save_settings = tk.BooleanVar(value=True)
        self.load_previous_settings = tk.BooleanVar(value=False)
        self.parallel_processing = tk.BooleanVar(value=False)
        self.max_workers = tk.IntVar(value=2)
        self.auto_retry = tk.BooleanVar(value=True)
        self.retry_attempts = tk.IntVar(value=3)
        
        # Progress tracking
        self.total_files = 0
        self.processed_files = 0
        self.failed_files = []
        self.start_time = None
        
    def create_batch_window(self):
        """Create advanced batch processing window with optional DnD support."""
        if _DND_AVAILABLE:
            # TkinterDnD.Toplevel enables drop target on this window
            self.batch_window = TkinterDnD.Toplevel(self.main_app.root)
        else:
            self.batch_window = tk.Toplevel(self.main_app.root)

        self.batch_window.title("Batch Processing - Advanced")
        self.batch_window.geometry("820x660")
        self.batch_window.minsize(640, 500)
        self.batch_window.transient(self.main_app.root)
        self.batch_window.grab_set()
        self.batch_window.configure(bg=self.main_app.get_theme_colors()['bg'])
        self.setup_batch_ui()
        
    def setup_batch_ui(self):
        """Setup batch processing UI with DnD, keyboard shortcuts, and rich progress."""
        main_frame = ttk.Frame(self.batch_window, padding="16")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # ── Title ────────────────────────────────────────────────────────────
        ttk.Label(main_frame, text="Advanced Batch Processing",
                  font=('Arial', 14, 'bold')).pack(pady=(0, 12))

        # ── Settings ─────────────────────────────────────────────────────────
        settings_frame = ttk.LabelFrame(main_frame, text="Settings", padding="8")
        settings_frame.pack(fill=tk.X, pady=(0, 8))

        row1 = ttk.Frame(settings_frame)
        row1.pack(fill=tk.X, pady=3)
        ttk.Checkbutton(row1, text="Save batch settings",
                        variable=self.save_settings).pack(side=tk.LEFT, padx=4)
        ttk.Checkbutton(row1, text="Load previous settings",
                        variable=self.load_previous_settings).pack(side=tk.LEFT, padx=4)

        row2 = ttk.Frame(settings_frame)
        row2.pack(fill=tk.X, pady=3)
        ttk.Checkbutton(row2, text="Parallel processing",
                        variable=self.parallel_processing,
                        command=self.toggle_parallel).pack(side=tk.LEFT, padx=4)
        ttk.Label(row2, text="Max workers:").pack(side=tk.LEFT, padx=4)
        ttk.Spinbox(row2, from_=1, to=8, textvariable=self.max_workers,
                    width=5).pack(side=tk.LEFT, padx=4)
        ttk.Checkbutton(row2, text="Auto-retry",
                        variable=self.auto_retry).pack(side=tk.LEFT, padx=12)
        ttk.Label(row2, text="Attempts:").pack(side=tk.LEFT)
        ttk.Spinbox(row2, from_=1, to=10, textvariable=self.retry_attempts,
                    width=5).pack(side=tk.LEFT, padx=4)

        # ── Queue frame ───────────────────────────────────────────────────────
        queue_frame = ttk.LabelFrame(main_frame, text="Queue", padding="8")
        queue_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 8))

        # Toolbar
        toolbar = ttk.Frame(queue_frame)
        toolbar.pack(fill=tk.X, pady=(0, 6))
        ttk.Button(toolbar, text="Add Files",
                   command=self.add_files).pack(side=tk.LEFT, padx=3)
        ttk.Button(toolbar, text="Add Folder",
                   command=self.add_folder).pack(side=tk.LEFT, padx=3)
        ttk.Button(toolbar, text="Remove Selected",
                   command=self.remove_selected).pack(side=tk.LEFT, padx=3)
        ttk.Button(toolbar, text="Clear All",
                   command=self.clear_queue).pack(side=tk.LEFT, padx=3)
        ttk.Button(toolbar, text="Save Queue",
                   command=self.save_queue).pack(side=tk.LEFT, padx=3)
        ttk.Button(toolbar, text="Load Queue",
                   command=self.load_queue).pack(side=tk.LEFT, padx=3)

        # Drop-zone hint
        if _DND_AVAILABLE:
            dnd_hint = ttk.Label(toolbar, text="  Drop PDF files here  ",
                                 relief='groove', foreground='#888')
            dnd_hint.pack(side=tk.RIGHT, padx=6)

        # Listbox
        list_frame = ttk.Frame(queue_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.queue_listbox = tk.Listbox(
            list_frame,
            yscrollcommand=scrollbar.set,
            selectmode=tk.EXTENDED,   # multi-select
            activestyle='dotbox'
        )
        self.queue_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.queue_listbox.yview)

        # Keyboard shortcut: Delete key removes selection
        self.queue_listbox.bind('<Delete>', lambda e: self.remove_selected())
        self.queue_listbox.bind('<BackSpace>', lambda e: self.remove_selected())

        # Right-click context menu
        self._ctx_menu = tk.Menu(self.queue_listbox, tearoff=0)
        self._ctx_menu.add_command(label="Remove selected",
                                   command=self.remove_selected)
        self._ctx_menu.add_command(label="Clear all",
                                   command=self.clear_queue)
        self.queue_listbox.bind('<Button-3>',
                                lambda e: self._ctx_menu.tk_popup(e.x_root, e.y_root))

        # Enable drag-and-drop onto the listbox
        if _DND_AVAILABLE:
            self.queue_listbox.drop_target_register(DND_FILES)
            self.queue_listbox.dnd_bind('<<Drop>>', self._on_drop)

        # ── Progress ──────────────────────────────────────────────────────────
        progress_frame = ttk.LabelFrame(main_frame, text="Progress", padding="8")
        progress_frame.pack(fill=tk.X, pady=(0, 8))

        # File-level progress bar
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate',
                                            maximum=100)
        self.progress_bar.pack(fill=tk.X, pady=(0, 4))

        # Two-row details
        row_a = ttk.Frame(progress_frame)
        row_a.pack(fill=tk.X)
        self.progress_label = ttk.Label(row_a, text="Ready — add files to start")
        self.progress_label.pack(side=tk.LEFT)
        self.time_label = ttk.Label(row_a, text="")
        self.time_label.pack(side=tk.RIGHT)

        row_b = ttk.Frame(progress_frame)
        row_b.pack(fill=tk.X, pady=(2, 0))
        self.page_label = ttk.Label(row_b, text="", foreground='#555')
        self.page_label.pack(side=tk.LEFT)

        # ── Action buttons ────────────────────────────────────────────────────
        action_frame = ttk.Frame(main_frame)
        action_frame.pack(fill=tk.X)
        ttk.Button(action_frame, text="Start Batch",
                   command=self.start_batch_processing).pack(side=tk.LEFT, padx=4)
        ttk.Button(action_frame, text="Pause",
                   command=self.pause_batch_processing).pack(side=tk.LEFT, padx=4)
        ttk.Button(action_frame, text="Stop",
                   command=self.stop_batch_processing).pack(side=tk.LEFT, padx=4)
        ttk.Button(action_frame, text="Export Report",
                   command=self.export_report).pack(side=tk.LEFT, padx=4)
        ttk.Button(action_frame, text="Close",
                   command=self.close_batch_window).pack(side=tk.RIGHT, padx=4)
        
    # ── DnD handler ───────────────────────────────────────────────────────────
    def _on_drop(self, event):
        """Handle files dropped onto the queue listbox."""
        # tkinterdnd2 gives a brace-quoted, space-separated list on Windows
        raw = event.data
        # Parse: {path with spaces} or plain path
        paths = []
        if raw.startswith('{'):
            import re
            paths = re.findall(r'\{([^}]+)\}|([^\s]+)', raw)
            paths = [a or b for a, b in paths]
        else:
            paths = raw.split()
        self._add_pdf_paths(paths)

    def _add_pdf_paths(self, paths):
        """Add a list of paths, filtering to PDFs only (recurse into folders)."""
        added = 0
        for p in paths:
            p = p.strip()
            if os.path.isdir(p):
                for root, _, files in os.walk(p):
                    for f in files:
                        if f.lower().endswith('.pdf'):
                            full = os.path.join(root, f)
                            if full not in self.batch_queue:
                                self.batch_queue.append(full)
                                self.queue_listbox.insert(tk.END, os.path.basename(full))
                                added += 1
            elif p.lower().endswith('.pdf') and p not in self.batch_queue:
                self.batch_queue.append(p)
                self.queue_listbox.insert(tk.END, os.path.basename(p))
                added += 1
        if added:
            self.update_queue_status()

    def remove_selected(self):
        """Remove selected items from the queue (supports multi-select)."""
        selected = list(self.queue_listbox.curselection())
        for idx in reversed(selected):   # reverse so indices stay valid
            self.queue_listbox.delete(idx)
            del self.batch_queue[idx]
        self.update_queue_status()

    def toggle_parallel(self):
        """Enable/disable parallel processing options."""
        if self.parallel_processing.get():
            self.max_workers.set(min(8, os.cpu_count() or 2))
        else:
            self.max_workers.set(1)
    
    def add_folder(self):
        """Add all PDF files from a folder."""
        folder_path = filedialog.askdirectory(title="Select Folder with PDF Files")
        if folder_path:
            self._add_pdf_paths([folder_path])
    
    def add_files(self):
        """Add individual PDF files."""
        file_paths = filedialog.askopenfilenames(
            title="Select PDF Files",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_paths:
            self._add_pdf_paths(list(file_paths))
    
    def clear_queue(self):
        """Clear the batch queue"""
        self.batch_queue.clear()
        self.queue_listbox.delete(0, tk.END)
        self.update_queue_status()
    
    def save_queue(self):
        """Save queue to file"""
        file_path = filedialog.asksaveasfilename(
            title="Save Batch Queue",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            queue_data = {
                "files": self.batch_queue,
                "settings": {
                    "save_settings": self.save_settings.get(),
                    "parallel_processing": self.parallel_processing.get(),
                    "max_workers": self.max_workers.get(),
                    "auto_retry": self.auto_retry.get(),
                    "retry_attempts": self.retry_attempts.get()
                },
                "timestamp": datetime.now().isoformat()
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(queue_data, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Success", f"Queue saved to {file_path}")
    
    def load_queue(self):
        """Load queue from file"""
        file_path = filedialog.askopenfilename(
            title="Load Batch Queue",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path and os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    queue_data = json.load(f)
                
                self.batch_queue = queue_data.get("files", [])
                settings = queue_data.get("settings", {})
                
                # Load settings
                self.save_settings.set(settings.get("save_settings", True))
                self.parallel_processing.set(settings.get("parallel_processing", False))
                self.max_workers.set(settings.get("max_workers", 2))
                self.auto_retry.set(settings.get("auto_retry", True))
                self.retry_attempts.set(settings.get("retry_attempts", 3))
                
                # Update UI
                self.queue_listbox.delete(0, tk.END)
                for file_path in self.batch_queue:
                    self.queue_listbox.insert(tk.END, os.path.basename(file_path))
                
                self.update_queue_status()
                messagebox.showinfo("Success", f"Queue loaded from {file_path}")
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load queue: {str(e)}")
    
    def update_queue_status(self):
        """Update queue count in progress label."""
        total = len(self.batch_queue)
        txt = "Queue empty — add PDF files or drop them here" if total == 0 \
              else f"{total} file{'s' if total != 1 else ''} in queue"
        self.progress_label.config(text=txt)
        if hasattr(self, 'page_label'):
            self.page_label.config(text="")
    
    def start_batch_processing(self):
        """Start batch processing"""
        if not self.batch_queue:
            messagebox.showwarning("No Files", "Please add files to the queue first")
            return
        
        self.processing = True
        self.start_time = time.time()
        self.total_files = len(self.batch_queue)
        self.processed_files = 0
        self.failed_files = []
        
        # Apply settings to main app
        self.apply_batch_settings()
        
        # Start processing
        if self.parallel_processing.get():
            self.process_parallel()
        else:
            self.process_sequential()
    
    def apply_batch_settings(self):
        """Apply batch settings to main application"""
        # Override main app settings with batch settings
        pass  # Settings would be applied to main app
    
    def process_sequential(self):
        """Process files sequentially in a background thread with per-page progress."""
        self.progress_bar.config(mode='determinate', maximum=100)
        self._total_pages_done = 0

        def page_cb(cur_page, total_pages, out_path):
            """Called from worker thread — schedule UI updates on mainloop."""
            self._total_pages_done += 1
            done = self._total_pages_done
            fname = os.path.basename(out_path)
            self.batch_window.after(0, lambda: (
                self.page_label.config(
                    text=f"Page {cur_page}/{total_pages} — {fname}  "
                         f"(total pages: {done})"
                ),
                self.update_time_display()
            ))

        def run():
            all_converted = []
            for i, pdf_file in enumerate(self.batch_queue):
                if not self.processing:
                    break

                # File-level bar: set to start-of-file %
                pct_start = i / self.total_files * 100
                fname = os.path.basename(pdf_file)
                self.batch_window.after(0, lambda p=pct_start, n=fname, idx=i: (
                    self.progress_bar.__setitem__('value', p),
                    self.progress_label.config(
                        text=f"File {idx+1}/{self.total_files}: {n}"
                    )
                ))

                try:
                    converted = self.process_single_file(
                        pdf_file,
                        file_index=(i, self.total_files),
                        page_callback=page_cb
                    )
                    all_converted.extend(converted)
                    self.processed_files += 1
                except Exception as e:
                    print(f"[ERR] {pdf_file}: {e}")
                    self.failed_files.append(pdf_file)
                    if self.auto_retry.get():
                        for _ in range(self.retry_attempts.get() - 1):
                            try:
                                converted = self.process_single_file(
                                    pdf_file,
                                    page_callback=page_cb
                                )
                                all_converted.extend(converted)
                                self.processed_files += 1
                                self.failed_files.remove(pdf_file)
                                break
                            except Exception:
                                pass

                # Advance bar to end-of-file %
                pct_end = (i + 1) / self.total_files * 100
                self.batch_window.after(0, lambda p=pct_end:
                    self.progress_bar.__setitem__('value', p))

            self._all_converted = all_converted
            self.batch_window.after(0, self.complete_batch_processing)

        threading.Thread(target=run, daemon=True).start()
    
    def process_parallel(self):
        """Process files in parallel in a background thread with determinate progress."""
        import concurrent.futures

        self.progress_bar.config(mode='determinate', maximum=100)
        self.progress_bar['value'] = 0
        self._total_pages_done = 0
        completed_lock = threading.Lock()
        completed_count = [0]   # mutable container for lambda capture

        def run():
            all_converted = []
            with concurrent.futures.ThreadPoolExecutor(
                    max_workers=self.max_workers.get()) as executor:
                futures = {executor.submit(self.process_single_file_safe, f): f
                           for f in self.batch_queue if self.processing}

                for future in concurrent.futures.as_completed(futures):
                    if not self.processing:
                        future.cancel()
                        continue
                    try:
                        result = future.result()
                        with completed_lock:
                            completed_count[0] += 1
                            done = completed_count[0]
                        if result['success']:
                            self.processed_files += 1
                            pages = result.get('converted', [])
                            all_converted.extend(pages)
                            self._total_pages_done += len(pages)
                            fname = os.path.basename(result['file'])
                            pct = done / self.total_files * 100
                            pg  = self._total_pages_done
                            self.batch_window.after(0, lambda p=pct, n=fname,
                                                           d=done, g=pg: (
                                self.progress_bar.__setitem__('value', p),
                                self.progress_label.config(
                                    text=f"{d}/{self.total_files} files done"
                                ),
                                self.page_label.config(
                                    text=f"{g} pages converted so far"
                                ),
                                self.update_time_display()
                            ))
                        else:
                            self.failed_files.append(result['file'])
                            print(f"[ERR] parallel: {result.get('error')}")
                    except Exception as e:
                        print(f"[ERR] parallel task: {e}")

            self._all_converted = all_converted
            self.batch_window.after(0, lambda: self.progress_bar.stop())
            self.batch_window.after(0, self.complete_batch_processing)

        threading.Thread(target=run, daemon=True).start()
    
    def process_single_file_safe(self, pdf_file):
        """Wrapper for parallel execution — returns result dict instead of raising."""
        try:
            converted = self.process_single_file(pdf_file)   # returns list
            return {'success': True, 'file': pdf_file, 'converted': converted}
        except Exception as e:
            return {'success': False, 'file': pdf_file, 'error': str(e), 'converted': []}
    
    def process_single_file(self, pdf_file, file_index=None, page_callback=None):
        """Process a single PDF file using the main app's conversion settings.

        Args:
            pdf_file: Path to the PDF file.
            file_index: (i, total) tuple for overall file-level progress.
            page_callback: Optional callable(current_page, total_pages, out_path)
                           called after each page is saved — use for per-page UI updates.
        Returns:
            List of output file paths.
        """
        app = self.main_app
        output_dir = app.output_folder.get()
        if not output_dir:
            output_dir = str(Path(pdf_file).parent)
        os.makedirs(output_dir, exist_ok=True)

        dpi             = app.dpi.get()
        quality         = app.quality.get()
        output_format   = app.output_format.get()
        png_compression = app.png_compression.get()
        webp_quality    = app.webp_quality.get()
        webp_method     = app.webp_method.get()

        doc = fitz.open(pdf_file)
        converted = []
        total_pages = len(doc)
        try:
            for page_num in range(total_pages):
                page = doc[page_num]
                mat  = fitz.Matrix(dpi / 72, dpi / 72)
                pix  = page.get_pixmap(matrix=mat)

                img_data = pix.tobytes("ppm")
                img      = Image.open(io.BytesIO(img_data))

                out_name = app.generate_filename(pdf_file, page_num + 1)
                out_path = os.path.join(output_dir, out_name)

                if output_format == "JPG":
                    img.save(out_path, "JPEG", quality=quality, optimize=True)
                elif output_format == "PNG":
                    img.save(out_path, "PNG", compress_level=png_compression)
                elif output_format == "WEBP":
                    img.save(out_path, "WEBP", quality=webp_quality, method=webp_method)
                else:
                    img.save(out_path, "JPEG", quality=quality, optimize=True)

                converted.append(out_path)

                # Per-page UI callback (safe — caller wraps in .after())
                if page_callback:
                    page_callback(page_num + 1, total_pages, out_path)
        finally:
            doc.close()

        return converted
    
    def pause_batch_processing(self):
        """Pause batch processing"""
        self.processing = False
        self.progress_label.config(text="Paused")
    
    def stop_batch_processing(self):
        """Stop batch processing"""
        self.processing = False
        self.progress_label.config(text="Stopped")
    
    def complete_batch_processing(self):
        """Complete batch processing — show summary, offer ZIP and open folder."""
        self.processing = False
        self.progress_bar.config(mode='determinate')
        self.progress_bar['value'] = 100

        elapsed_time   = time.time() - self.start_time if self.start_time else 0
        success_count  = self.processed_files
        failed_count   = len(self.failed_files)
        all_converted  = getattr(self, '_all_converted', [])
        total_pages    = len(all_converted)

        self.progress_label.config(
            text=f"Done: {success_count} files / {total_pages} pages ({failed_count} failed)"
        )
        self.time_label.config(text=f"Time: {elapsed_time:.1f}s")

        # Build summary message
        msg  = f"Batch complete!\n\n"
        msg += f"Files processed : {success_count} / {self.total_files}\n"
        msg += f"Pages converted : {total_pages}\n"
        msg += f"Failed          : {failed_count}\n"
        msg += f"Time elapsed    : {elapsed_time:.1f}s"
        if self.failed_files:
            msg += "\n\nFailed files:\n"
            for f in self.failed_files[:5]:
                msg += f"  - {os.path.basename(f)}\n"
            if len(self.failed_files) > 5:
                msg += f"  ... and {len(self.failed_files)-5} more"
        messagebox.showinfo("Batch Complete", msg)

        # Offer ZIP creation if we have output files
        app = self.main_app
        if all_converted and app.create_zip.get():
            output_dir = app.output_folder.get() or str(Path(all_converted[0]).parent)
            try:
                zip_path = app.create_zip_file(all_converted, output_dir)
                if zip_path:
                    messagebox.showinfo("ZIP Created", f"Archive saved:\n{zip_path}")
                    if app.delete_individual_files.get():
                        app.delete_individual_image_files(all_converted)
            except Exception as e:
                messagebox.showwarning("ZIP Error", f"Could not create ZIP:\n{e}")

        # Save history
        self.save_to_history()

        # Offer open folder
        output_dir = app.output_folder.get()
        if output_dir and messagebox.askyesno(
            "Open Folder", "Open the output folder?"
        ):
            os.startfile(output_dir)
    
    def update_time_display(self):
        """Update time display"""
        if self.start_time:
            elapsed = time.time() - self.start_time
            self.time_label.config(text=f"Time: {elapsed:.1f}s")
    
    def save_to_history(self):
        """Save batch to history"""
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "files": self.batch_queue.copy(),
            "total_files": self.total_files,
            "processed_files": self.processed_files,
            "failed_files": self.failed_files,
            "settings": {
                "parallel_processing": self.parallel_processing.get(),
                "max_workers": self.max_workers.get(),
                "auto_retry": self.auto_retry.get(),
                "retry_attempts": self.retry_attempts.get()
            }
        }
        
        self.batch_history.append(history_entry)
        
        # Keep only last 10 entries
        if len(self.batch_history) > 10:
            self.batch_history.pop(0)
    
    def export_report(self):
        """Export batch processing report"""
        if not self.batch_history:
            messagebox.showinfo("No History", "No batch processing history available")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="Export Batch Report",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write("PDF to JPG Converter - Batch Processing Report\n")
                    f.write("=" * 50 + "\n\n")
                    
                    for i, entry in enumerate(self.batch_history, 1):
                        f.write(f"Batch #{i}\n")
                        f.write(f"Timestamp: {entry['timestamp']}\n")
                        f.write(f"Total Files: {entry['total_files']}\n")
                        f.write(f"Processed: {entry['processed_files']}\n")
                        f.write(f"Failed: {len(entry['failed_files'])}\n")
                        
                        if entry['failed_files']:
                            f.write("\nFailed Files:\n")
                            for failed_file in entry['failed_files']:
                                f.write(f"- {os.path.basename(failed_file)}\n")
                        
                        f.write("\n" + "-" * 30 + "\n\n")
                
                messagebox.showinfo("Success", f"Report exported to {file_path}")
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export report: {str(e)}")
    
    def close_batch_window(self):
        """Close batch processing window"""
        if self.processing:
            if not messagebox.askyesno("Processing in Progress", 
                                         "Batch processing is still running. Stop and close?"):
                return
            self.stop_batch_processing()
        
        self.batch_window.destroy()

# Integration function to add batch processing to main app
def add_batch_processing_to_main_app(main_app):
    """Add batch processing functionality to main application"""
    processor = BatchProcessor(main_app)

    # Insert button into btn_row (the frame that holds file action buttons)
    # btn_row is the first child frame inside the pdf_card LabelFrame
    btn_row = main_app.btn_row
    batch_btn = ttk.Button(
        btn_row,
        text="📦 Batch",
        command=processor.create_batch_window
    )
    batch_btn.pack(side=tk.LEFT, padx=(0, 6))

    return processor

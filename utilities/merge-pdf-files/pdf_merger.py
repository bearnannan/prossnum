import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
import os
from PyPDF2 import PdfMerger, PdfReader
import threading

class PDFMergerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("PDF File Merger — Premium")
        self.root.geometry("900x700")
        
        self.pdf_files = []
        self.colors = {
            'bg': '#1C1917',        # Stone 900
            'card': '#292524',      # Stone 800
            'accent': '#EA580C',    # Orange 600
            'accent_hover': '#C2410C',
            'text': '#F5F5F4',      # Stone 100
            'text_dim': '#A8A29E',  # Stone 400
            'border': '#44403C'      # Stone 700
        }
        
        self.configure_styles()
        self.create_widgets()
        self.setup_dnd()
        
    def configure_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # General
        style.configure('TFrame', background=self.colors['bg'])
        style.configure('Card.TFrame', background=self.colors['card'])
        
        # Labels
        style.configure('TLabel', background=self.colors['bg'], foreground=self.colors['text'], font=('Inter', 10))
        style.configure('Title.TLabel', font=('Inter', 20, 'bold'), foreground=self.colors['accent'])
        style.configure('Header.TLabel', font=('Inter', 11, 'bold'), foreground=self.colors['text'])
        style.configure('Status.TLabel', font=('Inter', 9), foreground=self.colors['text_dim'])
        
        # Buttons
        style.configure('TButton', font=('Inter', 10, 'bold'), padding=8)
        style.configure('Accent.TButton', background=self.colors['accent'], foreground='white')
        style.map('Accent.TButton', background=[('active', self.colors['accent_hover'])])
        
        # Treeview
        style.configure('Treeview', 
                        background=self.colors['card'], 
                        foreground=self.colors['text'], 
                        fieldbackground=self.colors['card'],
                        borderwidth=0,
                        font=('Inter', 10),
                        rowheight=30)
        style.map('Treeview', background=[('selected', self.colors['accent'])])
        style.configure('Treeview.Heading', 
                        background=self.colors['border'], 
                        foreground=self.colors['text'], 
                        font=('Inter', 10, 'bold'),
                        padding=5)
        
        # Entry
        style.configure('TEntry', fieldbackground=self.colors['card'], foreground=self.colors['text'], insertcolor=self.colors['text'])
        
        # Progressbar
        style.configure('TProgressbar', thickness=6, background=self.colors['accent'], troughcolor=self.colors['card'], bordercolor=self.colors['card'])

    def create_widgets(self):
        self.root.configure(bg=self.colors['bg'])
        
        # Main container with padding
        self.container = ttk.Frame(self.root, padding="30")
        self.container.pack(fill=tk.BOTH, expand=True)
        
        # Header Area
        header_frame = ttk.Frame(self.container)
        header_frame.pack(fill=tk.X, pady=(0, 30))
        
        ttk.Label(header_frame, text="PDF File Merger", style='Title.TLabel').pack(side=tk.LEFT)
        ttk.Label(header_frame, text="v1.0 • Premium Edition", style='Status.TLabel').pack(side=tk.RIGHT, pady=(10, 0))
        
        # Action Bar
        action_frame = ttk.Frame(self.container)
        action_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.add_btn = ttk.Button(action_frame, text="+ Add PDF Files", command=self.add_files, style='Accent.TButton')
        self.add_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        ttk.Button(action_frame, text="Remove Selected", command=self.remove_selected).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(action_frame, text="Move Up", command=lambda: self.move_item(-1)).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(action_frame, text="Move Down", command=lambda: self.move_item(1)).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(action_frame, text="Clear All", command=self.clear_all).pack(side=tk.LEFT)
        
        # File List (Treeview)
        list_container = ttk.Frame(self.container, style='Card.TFrame', padding=2)
        list_container.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        columns = ('Size', 'Path')
        self.file_tree = ttk.Treeview(list_container, columns=columns, show='headings', selectmode='extended')
        self.file_tree.heading('Size', text='Size')
        self.file_tree.heading('Path', text='File Path')
        
        self.file_tree.column('Size', width=100, anchor=tk.CENTER)
        self.file_tree.column('Path', width=600)
        
        scrollbar = ttk.Scrollbar(list_container, orient=tk.VERTICAL, command=self.file_tree.yview)
        self.file_tree.configure(yscrollcommand=scrollbar.set)
        
        self.file_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Output Config Area
        config_frame = ttk.Frame(self.container)
        config_frame.pack(fill=tk.X, pady=(0, 30))
        
        ttk.Label(config_frame, text="Output File Name:", style='Header.TLabel').pack(anchor=tk.W, pady=(0, 10))
        
        output_inner = ttk.Frame(config_frame)
        output_inner.pack(fill=tk.X)
        
        self.output_var = tk.StringVar(value="merged_output.pdf")
        self.output_entry = ttk.Entry(output_inner, textvariable=self.output_var, font=('Inter', 11))
        self.output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        ttk.Button(output_inner, text="Browse Destination", command=self.browse_output).pack(side=tk.RIGHT)
        
        # Metadata & Security Area
        meta_security_frame = ttk.Frame(self.container)
        meta_security_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Metadata
        meta_frame = ttk.LabelFrame(meta_security_frame, text=" Metadata (Optional) ", padding=15)
        meta_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        ttk.Label(meta_frame, text="Title:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.title_var = tk.StringVar()
        ttk.Entry(meta_frame, textvariable=self.title_var).grid(row=0, column=1, sticky=tk.EW, pady=2, padx=(5, 0))
        
        ttk.Label(meta_frame, text="Author:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.author_var = tk.StringVar()
        ttk.Entry(meta_frame, textvariable=self.author_var).grid(row=1, column=1, sticky=tk.EW, pady=2, padx=(5, 0))
        meta_frame.columnconfigure(1, weight=1)
        
        # Security
        sec_frame = ttk.LabelFrame(meta_security_frame, text=" Security (Optional) ", padding=15)
        sec_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        ttk.Label(sec_frame, text="Password:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.pass_var = tk.StringVar()
        self.pass_entry = ttk.Entry(sec_frame, textvariable=self.pass_var, show="*")
        self.pass_entry.grid(row=0, column=1, sticky=tk.EW, pady=2, padx=(5, 0))
        
        self.show_pass = tk.BooleanVar()
        ttk.Checkbutton(sec_frame, text="Show", variable=self.show_pass, command=self.toggle_pass).grid(row=1, column=1, sticky=tk.W)
        sec_frame.columnconfigure(1, weight=1)
        
        # Bottom Actions
        bottom_frame = ttk.Frame(self.container)
        bottom_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.merge_btn = ttk.Button(bottom_frame, text="Merge All PDFs", command=self.merge_pdfs, style='Accent.TButton')
        self.merge_btn.pack(fill=tk.X, pady=(0, 20))
        
        self.progress = ttk.Progressbar(bottom_frame, mode='indeterminate')
        self.progress.pack(fill=tk.X, pady=(0, 10))
        
        self.status_var = tk.StringVar(value="Ready to merge")
        self.status_label = ttk.Label(bottom_frame, textvariable=self.status_var, style='Status.TLabel')
        self.status_label.pack()

    def setup_dnd(self):
        # Register the whole container as drop target
        self.container.drop_target_register(DND_FILES)
        self.container.dnd_bind('<<Drop>>', self._on_drop)
        # Also register the treeview
        self.file_tree.drop_target_register(DND_FILES)
        self.file_tree.dnd_bind('<<Drop>>', self._on_drop)
        
        self.status_var.set("Ready — Drag & Drop PDFs here")

    def _on_drop(self, event):
        files = self.root.tk.splitlist(event.data)
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        
        if not pdf_files:
            self.status_var.set("No PDF files detected in drop")
            return
            
        for file_path in pdf_files:
            if file_path not in self.pdf_files:
                self.pdf_files.append(file_path)
                self.add_file_to_list(file_path)
        
        self.status_var.set(f"Added {len(pdf_files)} files via Drag & Drop")

    def add_files(self):
        files = filedialog.askopenfilenames(
            title="Select PDF files",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        
        if not files:
            return
            
        for file_path in files:
            if file_path not in self.pdf_files:
                self.pdf_files.append(file_path)
                self.add_file_to_list(file_path)
                
    def add_file_to_list(self, file_path):
        try:
            file_size = os.path.getsize(file_path)
            size_str = self.format_file_size(file_size)
            # Insert into treeview (using file_path as values)
            self.file_tree.insert('', 'end', values=(size_str, file_path))
        except Exception as e:
            messagebox.showerror("Error", f"Error adding file: {str(e)}")
            
    def format_file_size(self, size_bytes):
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
            
    def remove_selected(self):
        selected_items = self.file_tree.selection()
        if not selected_items:
            messagebox.showwarning("Warning", "Please select files to remove")
            return
            
        # Collect paths to remove
        paths_to_remove = [self.file_tree.item(item)['values'][1] for item in selected_items]
        
        for item in selected_items:
            self.file_tree.delete(item)
            
        self.pdf_files = [f for f in self.pdf_files if f not in paths_to_remove]
        self.status_var.set(f"Removed {len(paths_to_remove)} files")

    def move_item(self, direction):
        """Move selected item up or down in the list"""
        selected = self.file_tree.selection()
        if not selected:
            return
        if len(selected) > 1:
            messagebox.showwarning("Warning", "Please select only one item to move")
            return
            
        index = self.file_tree.index(selected[0])
        new_index = index + direction
        
        if 0 <= new_index < len(self.file_tree.get_children()):
            # Move in underlying list
            item_path = self.pdf_files.pop(index)
            self.pdf_files.insert(new_index, item_path)
            
            # Move in UI
            self.file_tree.move(selected[0], '', new_index)
            self.file_tree.see(selected[0])
            self.status_var.set(f"Moved item {'up' if direction < 0 else 'down'}")
        
    def clear_all(self):
        self.pdf_files.clear()
        self.file_tree.delete(*self.file_tree.get_children())
        self.status_var.set("All files cleared")
            
    def browse_output(self):
        output_file = filedialog.asksaveasfilename(
            title="Save merged PDF as",
            defaultextension=".pdf",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if output_file:
            self.output_var.set(output_file)
            
    def merge_pdfs(self):
        if not self.pdf_files:
            messagebox.showwarning("Warning", "Please add PDF files to merge")
            return
            
        output_path = self.output_var.get().strip()
        if not output_path:
            messagebox.showwarning("Warning", "Please specify an output file name")
            return
            
        if not output_path.lower().endswith('.pdf'):
            output_path += '.pdf'
            
        thread = threading.Thread(target=self.merge_worker, args=(output_path,))
        thread.daemon = True
        thread.start()
        
    def toggle_pass(self):
        if self.show_pass.get():
            self.pass_entry.config(show="")
        else:
            self.pass_entry.config(show="*")

    def merge_worker(self, output_path):
        try:
            self.root.after(0, lambda: self.progress.start())
            self.root.after(0, lambda: self.merge_btn.config(state='disabled'))
            self.root.after(0, lambda: self.status_var.set("Merging PDFs..."))
            
            merger = PdfMerger()
            
            for file_path in self.pdf_files:
                merger.append(file_path)
            
            # Apply Metadata
            metadata = {}
            title = self.title_var.get().strip()
            author = self.author_var.get().strip()
            if title: metadata["/Title"] = title
            if author: metadata["/Author"] = author
            if metadata:
                merger.add_metadata(metadata)
            
            password = self.pass_var.get().strip()
            if password:
                import io
                from PyPDF2 import PdfWriter, PdfReader
                
                # Write to memory first to encrypt
                temp_stream = io.BytesIO()
                merger.write(temp_stream)
                merger.close()
                
                temp_stream.seek(0)
                reader = PdfReader(temp_stream)
                writer = PdfWriter()
                
                for page in reader.pages:
                    writer.add_page(page)
                
                writer.encrypt(password)
                with open(output_path, "wb") as f:
                    writer.write(f)
            else:
                merger.write(output_path)
                merger.close()
            
            self.root.after(0, lambda: self.progress.stop())
            self.root.after(0, lambda: self.merge_btn.config(state='normal'))
            self.root.after(0, lambda: self.status_var.set(f"Successfully merged {len(self.pdf_files)} files"))
            self.root.after(0, lambda: messagebox.showinfo("Success", f"PDFs merged successfully!\nSaved as: {output_path}"))
            
        except Exception as e:
            self.root.after(0, lambda: self.progress.stop())
            self.root.after(0, lambda: self.merge_btn.config(state='normal'))
            self.root.after(0, lambda: self.status_var.set("Error occurred"))
            self.root.after(0, lambda: messagebox.showerror("Error", f"Error merging PDFs: {str(e)}"))

def main():
    root = TkinterDnD.Tk()
    app = PDFMergerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()

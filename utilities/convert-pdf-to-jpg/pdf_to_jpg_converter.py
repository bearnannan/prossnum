import io
import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk
import fitz  # PyMuPDF
from pathlib import Path
try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    DRAG_DROP_AVAILABLE = True
except ImportError:
    DRAG_DROP_AVAILABLE = False
    print("⚠ Drag & Drop not available. Install with: pip install tkinterdnd2")

# Sentry initialization for crash reporting
try:
    import sentry_sdk
    # Using a placeholder DSN for demonstration/local use.
    # In production, replace with actual project DSN.
    sentry_sdk.init(
        dsn="https://examplePublicKey@o0.ingest.sentry.io/0",
        traces_sample_rate=1.0,
    )
    print("✓ Sentry SDK initialized for crash reporting.")
except ImportError:
    print("⚠ Sentry SDK not available. Run: pip install sentry-sdk")



class PDFToJPGConverter:
    def __init__(self):
        # Create window (with or without drag & drop support)
        if DRAG_DROP_AVAILABLE:
            self.root = TkinterDnD.Tk()
        else:
            self.root = tk.Tk()
            
        self.root.title("PDF to JPG Converter")
        self.root.geometry("700x600")
        self.root.resizable(True, True)
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.configure_styles()
        
        # Variables
        self.pdf_files = []  # List to store multiple PDF files
        self.output_folder = tk.StringVar()
        self.dpi = tk.IntVar(value=300)
        self.quality = tk.IntVar(value=95)
        self.progress_var = tk.DoubleVar()
        self.current_file_var = tk.StringVar()
        
        # File naming options
        self.naming_pattern = tk.StringVar(value="{filename}_page_{page:03d}")
        self.custom_prefix = tk.StringVar(value="")
        self.custom_suffix = tk.StringVar(value="")
        self.naming_format = tk.StringVar(value="standard")
        
        # Output format options
        self.output_format = tk.StringVar(value="JPG")
        self.png_compression = tk.IntVar(value=6)  # PNG compression level (0-9)
        self.webp_quality = tk.IntVar(value=90)   # WEBP quality (0-100)
        self.webp_method = tk.IntVar(value=4)     # WEBP compression method (0-6)
        
        # Preview options
        self.preview_enabled = tk.BooleanVar(value=False)
        self.selected_pages = {}  # {pdf_path: [selected_pages]}
        self.preview_thumbnails = {}  # Store thumbnail images (full preview)
        self._quick_preview_photos = {}  # {pdf_path: ImageTk.PhotoImage} for mini-strip
        
        # Compression options
        self.create_zip = tk.BooleanVar(value=False)
        self.zip_name = tk.StringVar(value="converted_images")
        self.delete_individual_files = tk.BooleanVar(value=False)
        self.zip_compression = tk.IntVar(value=6)  # 0-9
        
        # Theme options — default to dark (premium productivity tool per design system)
        self.dark_mode = tk.BooleanVar(value=True)
        self.current_theme = "dark"
        
        # Language options
        self.current_language = tk.StringVar(value="thai")
        self.translations = self.get_translations()
        
        self.setup_ui()
        if DRAG_DROP_AVAILABLE:
            self.setup_drag_drop()
        
        # Initialize naming pattern preview and format settings
        self.update_naming_pattern()
        self.update_format_settings()
        self.apply_theme()

    def configure_styles(self):
        """Configure modern ttk styles — ui-ux-pro-max design system (productivity/dark)."""
        self.font_family = 'Segoe UI'
        self.font_title = (self.font_family, 20, 'bold')
        self.font_heading = (self.font_family, 11, 'bold')
        self.font_normal = (self.font_family, 10)
        self.font_small = (self.font_family, 9)

        # Design system tokens: Operation orange on dark (micro-interactions style)
        accent = '#EA580C'          # Primary CTA — orange
        accent_hover = '#C2410C'    # Hover -1 shade
        accent_active = '#9A3412'   # Active/pressed -2 shade
        bg_main = '#1C1917'         # Dark background (design system bg)
        bg_card = '#292524'         # Card surface
        text_main = '#F5F5F4'       # Foreground — near white
        text_secondary = '#A8A29E'  # Muted — warm gray
        border = 'rgba(255,255,255,0.08)'  # Subtle border (will use hex equiv)
        border_hex = '#3C3836'

        self.style.configure('.', font=self.font_normal, background=bg_main, foreground=text_main)
        self.style.configure('TFrame', background=bg_main)
        self.style.configure('Card.TFrame', background=bg_card)

        self.style.configure('TLabel', background=bg_main, foreground=text_main, font=self.font_normal)
        self.style.configure('Title.TLabel', background=bg_main, foreground=text_main, font=self.font_title)
        self.style.configure('Heading.TLabel', background=bg_main, foreground=text_main, font=self.font_heading)
        self.style.configure('Secondary.TLabel', background=bg_main, foreground=text_secondary, font=self.font_small)
        self.style.configure('Info.TLabel', background=bg_main, foreground=accent, font=self.font_small)

        self.style.configure('TEntry', fieldbackground=bg_card, foreground=text_main,
                            insertcolor=text_main, font=self.font_normal, padding=(6, 4))
        self.style.map('TEntry', fieldbackground=[('readonly', bg_card)])

        # Standard buttons — dark surface, warm tone
        self.style.configure('TButton', background='#3C3836', foreground=text_main,
                            font=self.font_normal, padding=(10, 5))
        self.style.map('TButton',
                      background=[('active', '#504945'), ('pressed', '#665C54')],
                      foreground=[('active', text_main)])

        # Accent CTA — orange, micro-interaction 100ms (design system spec)
        self.style.configure('Accent.TButton', background=accent, foreground='#FFFFFF',
                            font=(self.font_family, 10, 'bold'), padding=(14, 7))
        self.style.map('Accent.TButton',
                      background=[('active', accent_hover), ('pressed', accent_active)],
                      foreground=[('active', '#FFFFFF'), ('pressed', '#FFFFFF')])

        # Ghost — minimal visibility, warm muted text
        self.style.configure('Ghost.TButton', background=bg_main, foreground=text_secondary,
                            font=self.font_normal, padding=(8, 4))
        self.style.map('Ghost.TButton',
                      background=[('active', '#3C3836')],
                      foreground=[('active', text_main)])

        self.style.configure('TLabelFrame', background=bg_card, foreground=text_main,
                            font=self.font_heading, borderwidth=1, relief='solid')
        self.style.configure('TLabelFrame.Label', background=bg_card, foreground=accent,
                            font=self.font_heading, padding=(6, 2))

        self.style.configure('TRadiobutton', background=bg_main, foreground=text_main, font=self.font_normal)
        self.style.configure('TCheckbutton', background=bg_main, foreground=text_main, font=self.font_normal)
        self.style.configure('TScale', background=bg_main, troughcolor='#3C3836', sliderlength=14)

        # Orange progress bar — 6px height (design system spec)
        self.style.configure('Horizontal.TProgressbar', background=accent,
                            troughcolor='#3C3836', borderwidth=0, thickness=6)

        # Scrollbars — warm dark tone
        self.style.configure('Vertical.TScrollbar', background='#504945',
                            troughcolor=bg_main, arrowcolor=text_secondary, bordercolor=bg_main)
        self.style.configure('Horizontal.TScrollbar', background='#504945',
                            troughcolor=bg_main, arrowcolor=text_secondary, bordercolor=bg_main)
        
    def setup_ui(self):
        font = self.font_family

        main_frame = ttk.Frame(self.root, padding="24")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)

        # === HEADER ===
        header = ttk.Frame(main_frame)
        header.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        header.columnconfigure(0, weight=1)

        title_wrap = ttk.Frame(header)
        title_wrap.grid(row=0, column=0, sticky=tk.W)
        self.title_label = ttk.Label(title_wrap, text="PDF to JPG Converter", style='Title.TLabel')
        self.title_label.pack(side=tk.LEFT)
        ttk.Label(title_wrap, text="  แปลง PDF เป็นรูปภาพคุณภาพสูง", style='Secondary.TLabel').pack(side=tk.LEFT, padx=(8, 0))

        ctrl = ttk.Frame(header)
        ctrl.grid(row=0, column=1, sticky=tk.E)
        self.language_button = ttk.Button(ctrl, text="TH", width=4, style='Ghost.TButton',
                                           command=self.toggle_language)
        self.language_button.pack(side=tk.LEFT, padx=(0, 6))
        self.theme_button = ttk.Button(ctrl, text="Dark", width=5, style='Ghost.TButton',
                                        command=self.toggle_theme)
        self.theme_button.pack(side=tk.LEFT)

        # === PDF CARD ===
        pdf_card = ttk.LabelFrame(main_frame, text="  เลือกไฟล์ PDF  ", padding="16")
        pdf_card.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        pdf_card.columnconfigure(0, weight=1)

        btn_row = ttk.Frame(pdf_card)
        btn_row.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.btn_row = btn_row  # expose for external modules (batch, scheduler)

        ttk.Button(btn_row, text="+ ไฟล์เดียว", command=self.browse_single_pdf).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="+ หลายไฟล์", command=self.browse_multiple_pdfs).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="+ เพิ่มไฟล์", command=self.add_more_pdfs).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="- ลบที่เลือก", command=self.remove_selected_pdf).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="ล้าง", style='Ghost.TButton', command=self.clear_pdf_list).pack(side=tk.LEFT, padx=(0, 14))

        self.convert_button = ttk.Button(btn_row, text="แปลง PDF เป็น JPG",
                                          command=self.convert_multiple_pdfs, style='Accent.TButton')
        self.convert_button.pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="ออก", style='Ghost.TButton', command=self.root.quit).pack(side=tk.LEFT)


        # Drop zone
        drop_wrap = ttk.Frame(pdf_card)
        drop_wrap.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 6))
        drop_wrap.columnconfigure(0, weight=1)
        drop_wrap.rowconfigure(0, weight=1)

        scrl = ttk.Scrollbar(drop_wrap, style='Vertical.TScrollbar')
        scrl.grid(row=0, column=1, sticky=(tk.N, tk.S))

        self.drop_area = tk.Listbox(drop_wrap, height=5, yscrollcommand=scrl.set,
                                     bg='#ffffff', fg='#64748b',
                                     selectbackground='#2563eb', selectforeground='#ffffff',
                                     relief='flat', borderwidth=1, highlightthickness=1,
                                     highlightcolor='#e2e8f0', highlightbackground='#e2e8f0',
                                     font=(font, 10))
        self.drop_area.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrl.config(command=self.drop_area.yview)
        self.pdf_listbox = self.drop_area

        if DRAG_DROP_AVAILABLE:
            self.drop_area.insert(tk.END, "  ลากไฟล์ PDF มาวางที่นี่...")
        else:
            self.drop_area.insert(tk.END, "  ใช้ปุ่มด้านบนเพื่อเลือกไฟล์")

        self.file_count_label = ttk.Label(pdf_card, text="จำนวนไฟล์: 0", style='Secondary.TLabel')
        self.file_count_label.grid(row=2, column=0, sticky=tk.W)

        # ── Quick preview strip (hidden until files added) ─────────────────
        self._qprev_frame = ttk.Frame(pdf_card)
        self._qprev_frame.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=(4, 0))
        self._qprev_frame.grid_remove()   # start hidden

        qprev_wrap = ttk.Frame(self._qprev_frame)
        qprev_wrap.pack(fill=tk.X, expand=True)

        self._qprev_canvas = tk.Canvas(
            qprev_wrap, height=100, bg='#1C1917', highlightthickness=0
        )
        self._qprev_hscroll = ttk.Scrollbar(
            qprev_wrap, orient=tk.HORIZONTAL,
            command=self._qprev_canvas.xview
        )
        self._qprev_canvas.configure(xscrollcommand=self._qprev_hscroll.set)
        self._qprev_canvas.pack(fill=tk.X, expand=True)
        self._qprev_hscroll.pack(fill=tk.X)

        # Inner frame so items flow horizontally inside canvas
        self._qprev_inner = ttk.Frame(self._qprev_canvas)
        self._qprev_canvas_win = self._qprev_canvas.create_window(
            (0, 0), window=self._qprev_inner, anchor='nw'
        )
        self._qprev_inner.bind('<Configure>', lambda e: (
            self._qprev_canvas.configure(
                scrollregion=self._qprev_canvas.bbox('all')
            )
        ))

        # === OUTPUT ===
        out_frame = ttk.Frame(main_frame)
        out_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        out_frame.columnconfigure(1, weight=1)

        ttk.Label(out_frame, text="โฟลเดอร์เก็บไฟล์:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        ttk.Entry(out_frame, textvariable=self.output_folder).grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        ttk.Button(out_frame, text="เลือกโฟลเดอร์", command=self.browse_output).grid(row=0, column=2, sticky=tk.E)

        # === SETTINGS CARD ===
        set_card = ttk.LabelFrame(main_frame, text="  ตั้งค่า  ", padding="16")
        set_card.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        set_card.columnconfigure(1, weight=1)

        ttk.Label(set_card, text="ความละเอียด (DPI):").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        dpi_s = ttk.Scale(set_card, from_=72, to=600, variable=self.dpi, orient=tk.HORIZONTAL)
        dpi_s.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        self.dpi_label = ttk.Label(set_card, text="300", style='Info.TLabel')
        self.dpi_label.grid(row=0, column=2)
        dpi_s.configure(command=self.update_dpi_label)

        ttk.Label(set_card, text="รูปแบบไฟล์:").grid(row=1, column=0, sticky=tk.W, pady=(10, 0), padx=(0, 10))
        fmt_row = ttk.Frame(set_card)
        fmt_row.grid(row=1, column=1, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
        for t, v in [("JPG", "JPG"), ("PNG", "PNG"), ("WEBP", "WEBP")]:
            ttk.Radiobutton(fmt_row, text=t, variable=self.output_format,
                            value=v, command=self.update_format_settings).pack(side=tk.LEFT, padx=(0, 14))

        self.jpg_frame = ttk.Frame(set_card)
        self.jpg_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(6, 0))
        ttk.Label(self.jpg_frame, text="คุณภาพ JPG:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        q_s = ttk.Scale(self.jpg_frame, from_=10, to=100, variable=self.quality, orient=tk.HORIZONTAL)
        q_s.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        self.quality_label = ttk.Label(self.jpg_frame, text="95", style='Info.TLabel')
        self.quality_label.grid(row=0, column=2)
        q_s.configure(command=self.update_quality_label)

        self.png_frame = ttk.Frame(set_card)
        ttk.Label(self.png_frame, text="การบีบอัด PNG:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        png_s = ttk.Scale(self.png_frame, from_=0, to=9, variable=self.png_compression, orient=tk.HORIZONTAL)
        png_s.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        self.png_label = ttk.Label(self.png_frame, text="6", style='Info.TLabel')
        self.png_label.grid(row=0, column=2)
        png_s.configure(command=self.update_png_label)
        ttk.Label(self.png_frame, text="0 = ไม่บีบอัด  •  9 = บีบอัดสูงสุด", style='Secondary.TLabel').grid(row=1, column=1, sticky=tk.W, pady=(2, 0))

        self.webp_frame = ttk.Frame(set_card)
        ttk.Label(self.webp_frame, text="คุณภาพ WEBP:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        wq_s = ttk.Scale(self.webp_frame, from_=0, to=100, variable=self.webp_quality, orient=tk.HORIZONTAL)
        wq_s.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        self.webp_quality_label = ttk.Label(self.webp_frame, text="90", style='Info.TLabel')
        self.webp_quality_label.grid(row=0, column=2)
        wq_s.configure(command=self.update_webp_quality_label)
        ttk.Label(self.webp_frame, text="ความเร็วบีบอัด:").grid(row=1, column=0, sticky=tk.W, pady=(6, 0), padx=(0, 10))
        wm_s = ttk.Scale(self.webp_frame, from_=0, to=6, variable=self.webp_method, orient=tk.HORIZONTAL)
        wm_s.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=(6, 0), padx=(0, 10))
        self.webp_method_label = ttk.Label(self.webp_frame, text="4", style='Info.TLabel')
        self.webp_method_label.grid(row=1, column=2, pady=(6, 0))
        wm_s.configure(command=self.update_webp_method_label)
        ttk.Label(self.webp_frame, text="0 = เร็ว  •  6 = ช้า/บีบอัดดีที่สุด", style='Secondary.TLabel').grid(row=2, column=1, sticky=tk.W, pady=(2, 0))

        self.format_info = ttk.Label(set_card, text="JPG: ขนาดเล็ก  •  PNG: คมชัดสูง  •  WEBP: สมดุล", style='Info.TLabel')
        self.format_info.grid(row=3, column=0, columnspan=3, pady=(10, 0), sticky=tk.W)

        # === NAMING CARD ===
        name_card = ttk.LabelFrame(main_frame, text="  การตั้งชื่อไฟล์  ", padding="16")
        name_card.grid(row=4, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        name_card.columnconfigure(1, weight=1)

        ttk.Label(name_card, text="รูปแบบ:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        name_row = ttk.Frame(name_card)
        name_row.grid(row=0, column=1, columnspan=2, sticky=(tk.W, tk.E))
        for t, v in [("มาตรฐาน", "standard"), ("เลขหน้าง่าย", "simple"), ("มีวันที่", "with_date"), ("กำหนดเอง", "custom")]:
            ttk.Radiobutton(name_row, text=t, variable=self.naming_format,
                            value=v, command=self.update_naming_pattern).pack(side=tk.LEFT, padx=(0, 14))

        ttk.Label(name_card, text="ตัวอย่าง:").grid(row=1, column=0, sticky=tk.W, pady=(10, 0), padx=(0, 10))
        self.pattern_preview = ttk.Label(name_card, text="document_page_001.jpg", style='Info.TLabel')
        self.pattern_preview.grid(row=1, column=1, sticky=tk.W, pady=(10, 0))

        ttk.Label(name_card, text="รูปแบบกำหนดเอง:").grid(row=2, column=0, sticky=tk.W, pady=(8, 0), padx=(0, 10))
        self.pattern_entry = ttk.Entry(name_card, textvariable=self.naming_pattern)
        self.pattern_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=(8, 0), padx=(0, 10))
        self.pattern_entry.bind('<KeyRelease>', self.update_pattern_preview)
        ttk.Button(name_card, text="? คำแนะนำ", style='Ghost.TButton',
                   command=self.show_naming_help).grid(row=2, column=2, pady=(8, 0))

        ps_row = ttk.Frame(name_card)
        ps_row.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(8, 0))
        ttk.Label(ps_row, text="คำนำหน้า:").pack(side=tk.LEFT, padx=(0, 6))
        ttk.Entry(ps_row, textvariable=self.custom_prefix, width=16).pack(side=tk.LEFT, padx=(0, 14))
        ttk.Label(ps_row, text="คำต่อท้าย:").pack(side=tk.LEFT, padx=(0, 6))
        ttk.Entry(ps_row, textvariable=self.custom_suffix, width=16).pack(side=tk.LEFT)

        # === PREVIEW CARD ===
        pre_card = ttk.LabelFrame(main_frame, text="  ดูตัวอย่างหน้า PDF  ", padding="16")
        pre_card.grid(row=5, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        pre_card.columnconfigure(1, weight=1)

        ttk.Checkbutton(pre_card, text="เปิดการดูตัวอย่าง",
                        variable=self.preview_enabled, command=self.toggle_preview).grid(row=0, column=0, sticky=tk.W)

        self.preview_controls = ttk.Frame(pre_card)
        self.preview_controls.grid(row=0, column=1, sticky=tk.E, pady=(0, 6))
        ttk.Button(self.preview_controls, text="โหลดตัวอย่าง", command=self.load_previews).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(self.preview_controls, text="เลือกทั้งหมด", command=self.select_all_pages).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(self.preview_controls, text="ยกเลิกเลือก", command=self.deselect_all_pages).pack(side=tk.LEFT)

        self.preview_info = ttk.Label(pre_card, text="เลือกไฟล์ PDF และกด 'โหลดตัวอย่าง' เพื่อดูหน้าต่างๆ", style='Secondary.TLabel')
        self.preview_info.grid(row=1, column=0, columnspan=2, pady=(6, 0), sticky=tk.W)

        self.preview_canvas_frame = ttk.Frame(pre_card)
        self.preview_canvas_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(6, 0))
        self.preview_canvas_frame.grid_remove()

        cvs_wrap = ttk.Frame(self.preview_canvas_frame)
        cvs_wrap.pack(fill=tk.BOTH, expand=True)
        self.preview_canvas = tk.Canvas(cvs_wrap, height=150, bg='#ffffff',
                                         highlightthickness=1, highlightcolor='#e2e8f0', highlightbackground='#e2e8f0')
        vsc = ttk.Scrollbar(cvs_wrap, orient=tk.VERTICAL, command=self.preview_canvas.yview)
        hsc = ttk.Scrollbar(cvs_wrap, orient=tk.HORIZONTAL, command=self.preview_canvas.xview)
        self.preview_canvas.configure(yscrollcommand=vsc.set, xscrollcommand=hsc.set)
        self.preview_canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        vsc.grid(row=0, column=1, sticky=(tk.N, tk.S))
        hsc.grid(row=1, column=0, sticky=(tk.W, tk.E))
        cvs_wrap.columnconfigure(0, weight=1)
        cvs_wrap.rowconfigure(0, weight=1)

        # === COMPRESSION CARD ===
        zip_card = ttk.LabelFrame(main_frame, text="  บีบอัดไฟล์  ", padding="16")
        zip_card.grid(row=6, column=0, sticky=(tk.W, tk.E), pady=(0, 14))
        zip_card.columnconfigure(1, weight=1)

        ttk.Checkbutton(zip_card, text="สร้างไฟล์ ZIP",
                        variable=self.create_zip, command=self.toggle_zip_options).grid(row=0, column=0, sticky=tk.W)

        self.zip_settings_frame = ttk.Frame(zip_card)
        self.zip_settings_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(6, 0))
        self.zip_settings_frame.grid_remove()

        ttk.Label(self.zip_settings_frame, text="ชื่อไฟล์:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        ttk.Entry(self.zip_settings_frame, textvariable=self.zip_name, width=28).grid(row=0, column=1, sticky=tk.W, padx=(0, 10))
        ttk.Label(self.zip_settings_frame, text=".zip").grid(row=0, column=2, sticky=tk.W)

        ttk.Label(self.zip_settings_frame, text="ระดับบีบอัด:").grid(row=1, column=0, sticky=tk.W, pady=(8, 0), padx=(0, 10))
        zsc = ttk.Scale(self.zip_settings_frame, from_=0, to=9, variable=self.zip_compression, orient=tk.HORIZONTAL)
        zsc.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=(8, 0), padx=(0, 10))
        self.zip_label = ttk.Label(self.zip_settings_frame, text="6", style='Info.TLabel')
        self.zip_label.grid(row=1, column=2, pady=(8, 0))
        zsc.configure(command=self.update_zip_label)
        ttk.Label(self.zip_settings_frame, text="0 = เร็ว  •  9 = บีบอัดดีที่สุด", style='Secondary.TLabel').grid(row=2, column=1, sticky=tk.W, pady=(2, 0))

        ttk.Checkbutton(self.zip_settings_frame, text="ลบไฟล์รูปภาพหลังสร้าง ZIP",
                        variable=self.delete_individual_files).grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=(8, 0))

        self.compression_info = ttk.Label(zip_card, text="ZIP ช่วยลดขนาดไฟล์และง่ายต่อการแชร์", style='Secondary.TLabel')
        self.compression_info.grid(row=2, column=0, columnspan=3, pady=(10, 0), sticky=tk.W)

        # === PROGRESS ===
        self.current_file_label = ttk.Label(main_frame, textvariable=self.current_file_var, style='Info.TLabel')
        self.current_file_label.grid(row=7, column=0, pady=(0, 6), sticky=tk.W)

        self.progress_bar = ttk.Progressbar(main_frame, variable=self.progress_var,
                                             maximum=100, mode='determinate')
        self.progress_bar.grid(row=8, column=0, sticky=(tk.W, tk.E), pady=(0, 10))

        # === STATUS ===
        self.status_label = ttk.Label(main_frame, text="พร้อมทำงาน", style='Secondary.TLabel')
        self.status_label.grid(row=9, column=0, sticky=tk.W)
        self.update_status_with_theme("พร้อมทำงาน", "success")
        self.apply_language()

    def update_dpi_label(self, value):
        self.dpi_label.config(text=str(int(float(value))))
        
    def update_quality_label(self, value):
        self.quality_label.config(text=str(int(float(value))))
    
    def update_png_label(self, value):
        self.png_label.config(text=str(int(float(value))))
    
    def update_webp_quality_label(self, value):
        self.webp_quality_label.config(text=str(int(float(value))))
    
    def update_webp_method_label(self, value):
        self.webp_method_label.config(text=str(int(float(value))))
    
    def update_zip_label(self, value):
        self.zip_label.config(text=str(int(float(value))))
    
    def toggle_zip_options(self):
        """Show/hide ZIP options"""
        if self.create_zip.get():
            self.zip_settings_frame.grid()
        else:
            self.zip_settings_frame.grid_remove()
    
    def update_format_settings(self):
        """Show/hide format-specific settings"""
        format_type = self.output_format.get()
        
        # Hide all format frames
        self.jpg_frame.grid_remove()
        self.png_frame.grid_remove()
        self.webp_frame.grid_remove()
        
        # Show relevant frame
        if format_type == "JPG":
            self.jpg_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        elif format_type == "PNG":
            self.png_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        elif format_type == "WEBP":
            self.webp_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        
        # Update format info
        info_text = {
            "JPG": "JPG: ขนาดเล็ก เหมาะกับเว็บและการแชร์",
            "PNG": "PNG: คมชัดสูง รองรับพื้นหลังโปร่งใส",
            "WEBP": "WEBP: สมดุลระหว่างขนาดและคุณภาพ"
        }
        self.format_info.config(text=info_text.get(format_type, ""))
        
        # Update convert button text
        button_text = {
            "JPG": "แปลง PDF เป็น JPG",
            "PNG": "แปลง PDF เป็น PNG", 
            "WEBP": "แปลง PDF เป็น WEBP"
        }
        self.convert_button.config(text=button_text.get(format_type, "แปลง PDF"))
        
        # Update pattern preview with correct extension
        self.update_pattern_preview()
    
    def update_naming_pattern(self):
        """Update naming pattern based on selection"""
        format_type = self.naming_format.get()
        
        patterns = {
            "standard": "{filename}_page_{page:03d}",
            "simple": "{filename}_{page}",
            "with_date": "{filename}_{date}_page_{page:03d}",
            "custom": self.naming_pattern.get()
        }
        
        if format_type != "custom":
            self.naming_pattern.set(patterns[format_type])
        
        # Enable/disable custom pattern entry
        if format_type == "custom":
            self.pattern_entry.config(state='normal')
        else:
            self.pattern_entry.config(state='disabled')
        
        self.update_pattern_preview()
    
    def update_pattern_preview(self, event=None):
        """Update the pattern preview"""
        try:
            pattern = self.naming_pattern.get()
            prefix = self.custom_prefix.get()
            suffix = self.custom_suffix.get()
            
            # Create test filename
            test_name = pattern.format(
                filename="document",
                page=1,
                date="2026-04-26"
            )
            
            # Add prefix and suffix
            if prefix:
                test_name = f"{prefix}{test_name}"
            if suffix:
                test_name = f"{test_name}{suffix}"
            
            # Get file extension from selected format
            format_type = self.output_format.get().lower()
            test_name = f"{test_name}.{format_type}"
            self.pattern_preview.config(text=test_name)
        except:
            self.pattern_preview.config(text="รูปแบบไม่ถูกต้อง", foreground="red")
    
    def show_naming_help(self):
        """Show naming pattern help dialog"""
        help_text = """คำแนะนำการตั้งชื่อไฟล์:

📝 ตัวแปรที่ใช้ได้:
• {filename} - ชื่อไฟล์ PDF (ไม่มีนามสกุล)
• {page} - หมายเลขหน้า
• {page:03d} - หมายเลขหน้า 3 หลัก (001, 002, ...)
• {date} - วันที่ปัจจุบัน (YYYY-MM-DD)

🎯 ตัวอย่างรูปแบบ:
• {filename}_page_{page:03d} → document_page_001.jpg
• {filename}_{page} → document_1.jpg
• {filename}_{date}_p{page} → document_2026-04-26_p1.jpg
• scan_{page:03d} → scan_001.jpg

💡 คำแนะนำ:
• ใช้ {page:03d} สำหรับเรียงลำดับไฟล์สวยงาม
• เพิ่มคำนำหน้า/ต่อท้ายเพื่อจัดกลุ่มไฟล์
• หลีกเลี่ยงอักขระพิเศษในชื่อไฟล์"""
        
        messagebox.showinfo("คำแนะนำการตั้งชื่อไฟล์", help_text)
    
    def generate_filename(self, pdf_path, page_num):
        """Generate filename based on pattern"""
        try:
            import datetime
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            
            # Get base filename
            pdf_name = Path(pdf_path).stem
            
            # Format the pattern
            pattern = self.naming_pattern.get()
            filename = pattern.format(
                filename=pdf_name,
                page=page_num,
                date=today
            )
            
            # Add prefix and suffix
            prefix = self.custom_prefix.get()
            suffix = self.custom_suffix.get()
            
            if prefix:
                filename = f"{prefix}{filename}"
            if suffix:
                filename = f"{filename}{suffix}"
            
            # Get file extension from selected format
            format_type = self.output_format.get().lower()
            return f"{filename}.{format_type}"
            
        except Exception as e:
            # Fallback to default pattern
            pdf_name = Path(pdf_path).stem
            return f"{pdf_name}_page_{page_num:03d}.jpg"
    
    def toggle_preview(self):
        """Toggle preview visibility"""
        if self.preview_enabled.get():
            self.preview_canvas_frame.grid()
            self.preview_controls.grid()
        else:
            self.preview_canvas_frame.grid_remove()
            self.preview_controls.grid_remove()
    
    def load_previews(self):
        """Load thumbnail previews for all PDF files"""
        if not self.pdf_files:
            messagebox.showwarning("ไม่มีไฟล์", "กรุณาเลือกไฟล์ PDF ก่อน")
            return
        
        self.update_status_with_theme("กำลังโหลดตัวอย่าง...", "info")
        self.root.update()
        
        # Clear existing previews
        self.preview_canvas.delete("all")
        self.preview_thumbnails.clear()
        self.selected_pages.clear()
        
        try:
            thumbnail_size = 120
            padding = 10
            x_pos = padding
            y_pos = padding
            
            for pdf_idx, pdf_path in enumerate(self.pdf_files):
                try:
                    # Open PDF
                    pdf_document = fitz.open(pdf_path)
                    total_pages = len(pdf_document)
                    pdf_name = Path(pdf_path).stem
                    
                    # Initialize selected pages for this PDF
                    self.selected_pages[pdf_path] = list(range(1, total_pages + 1))
                    
                    # Add filename label
                    self.preview_canvas.create_text(
                        x_pos + thumbnail_size // 2, y_pos - 5,
                        text=f"{pdf_name} ({total_pages} หน้า)",
                        font=(self.font_family, 10, 'bold'),
                        anchor='s'
                    )
                    y_pos += 20
                    
                    # Create thumbnails for each page
                    for page_num in range(min(total_pages, 10)):  # Limit to first 10 pages for performance
                        try:
                            # Get page
                            page = pdf_document[page_num]
                            
                            # Render thumbnail
                            mat = fitz.Matrix(0.3, 0.3)  # Small scale for thumbnail
                            pix = page.get_pixmap(matrix=mat)
                            
                            # Convert to PIL Image
                            img_data = pix.tobytes("ppm")
                            img = Image.open(io.BytesIO(img_data))
                            
                            # Resize to standard thumbnail size
                            img.thumbnail((thumbnail_size, thumbnail_size), Image.Resampling.LANCZOS)
                            
                            # Convert to PhotoImage using ImageTk (correct method)
                            photo = ImageTk.PhotoImage(img)
                            
                            # Store reference to prevent garbage collection
                            self.preview_thumbnails[f"{pdf_path}_{page_num}"] = photo
                            
                            # Create thumbnail frame with checkbox
                            thumbnail_id = self.preview_canvas.create_image(
                                x_pos + thumbnail_size // 2, 
                                y_pos + thumbnail_size // 2,
                                image=photo
                            )
                            
                            # Create selection rectangle
                            rect_id = self.preview_canvas.create_rectangle(
                                x_pos - 2, y_pos - 2,
                                x_pos + thumbnail_size + 2, y_pos + thumbnail_size + 2,
                                outline='blue', width=2
                            )
                            
                            # Add page number label
                            text_id = self.preview_canvas.create_text(
                                x_pos + thumbnail_size // 2,
                                y_pos + thumbnail_size + 15,
                                text=f"หน้า {page_num + 1}",
                                font=(self.font_family, 9)
                            )
                            
                            # Store page info for click handling
                            self.preview_canvas.tag_bind(
                                thumbnail_id, '<Button-1>',
                                lambda e, p=pdf_path, pn=page_num + 1, r=rect_id: self.toggle_page_selection(p, pn, r)
                            )
                            self.preview_canvas.tag_bind(
                                rect_id, '<Button-1>',
                                lambda e, p=pdf_path, pn=page_num + 1, r=rect_id: self.toggle_page_selection(p, pn, r)
                            )
                            
                            # Move to next position
                            x_pos += thumbnail_size + padding
                            if x_pos > 800:  # Wrap to next row
                                x_pos = padding
                                y_pos += thumbnail_size + 40
                            
                        except Exception as e:
                            print(f"Error creating thumbnail for page {page_num + 1}: {e}")
                            continue
                    
                    # Show "more pages" indicator if there are more than 10 pages
                    if total_pages > 10:
                        self.preview_canvas.create_text(
                            x_pos + 50, y_pos + thumbnail_size // 2,
                            text=f"...+{total_pages - 10} หน้า",
                            font=(self.font_family, 10, 'italic'),
                            fill='#94a3b8'
                        )
                    
                    pdf_document.close()
                    
                    # Add spacing between PDFs
                    y_pos += thumbnail_size + 40
                    x_pos = padding
                    
                except Exception as e:
                    print(f"Error processing PDF {pdf_path}: {e}")
                    continue
            
            # Update canvas scroll region
            self.preview_canvas.configure(scrollregion=self.preview_canvas.bbox("all"))
            
            self.update_status_with_theme("โหลดตัวอย่างสำเร็จ", "success")
            self.preview_info.config(text=f"แสดงตัวอย่าง {len(self.pdf_files)} ไฟล์ • คลิกที่หน้าเพื่อเลือก/ยกเลิก")
            
        except Exception as e:
            self.update_status_with_theme("เกิดข้อผิดพลาดในการโหลดตัวอย่าง", "error")
            messagebox.showerror("ข้อผิดพลาด", f"ไม่สามารถโหลดตัวอย่าง: {str(e)}")
    
    def toggle_page_selection(self, pdf_path, page_num, rect_id):
        """Toggle selection of a specific page"""
        if pdf_path not in self.selected_pages:
            self.selected_pages[pdf_path] = []
        
        if page_num in self.selected_pages[pdf_path]:
            # Deselect page
            self.selected_pages[pdf_path].remove(page_num)
            self.preview_canvas.itemconfig(rect_id, outline='gray', width=1)
        else:
            # Select page
            self.selected_pages[pdf_path].append(page_num)
            self.preview_canvas.itemconfig(rect_id, outline='blue', width=2)
    
    def select_all_pages(self):
        """Select all pages for all PDFs"""
        for pdf_path in self.pdf_files:
            try:
                pdf_document = fitz.open(pdf_path)
                total_pages = len(pdf_document)
                self.selected_pages[pdf_path] = list(range(1, total_pages + 1))
                pdf_document.close()
            except:
                continue
        
        # Update visual selection
        self.update_preview_selection()
        self.preview_info.config(text="เลือกทุกหน้าแล้ว")
    
    def deselect_all_pages(self):
        """Deselect all pages"""
        for pdf_path in self.pdf_files:
            self.selected_pages[pdf_path] = []
        
        # Update visual selection
        self.update_preview_selection()
        self.preview_info.config(text="ยกเลิกเลือกทุกหน้าแล้ว")
    
    def update_preview_selection(self):
        """Update visual selection in preview"""
        # This would require storing rect_ids and updating them
        # For simplicity, we'll just update the info label
        total_selected = sum(len(pages) for pages in self.selected_pages.values())
        if total_selected > 0:
            self.preview_info.config(text=f"เลือก {total_selected} หน้าแล้ว")
        else:
            self.preview_info.config(text="ไม่ได้เลือกหน้าใด")
        
    def get_selected_pages_for_pdf(self, pdf_path):
        """Get selected pages for a specific PDF"""
        if pdf_path in self.selected_pages and self.selected_pages[pdf_path]:
            return self.selected_pages[pdf_path]
        else:
            # Return all pages if none selected (convert all)
            try:
                pdf_document = fitz.open(pdf_path)
                total_pages = len(pdf_document)
                pdf_document.close()
                return list(range(1, total_pages + 1))
            except:
                return [1]  # Fallback to first page
        
    def browse_single_pdf(self):
        file_path = filedialog.askopenfilename(
            title="เลือกไฟล์ PDF",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_path:
            self.clear_pdf_list()
            self.add_pdf_to_list(file_path)
            # Auto-set output folder to PDF's directory
            if not self.output_folder.get():
                self.output_folder.set(os.path.dirname(file_path))
    
    def browse_multiple_pdfs(self):
        file_paths = filedialog.askopenfilenames(
            title="เลือกไฟล์ PDF หลายไฟล์",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_paths:
            self.clear_pdf_list()
            for file_path in file_paths:
                self.add_pdf_to_list(file_path)
            # Auto-set output folder to first PDF's directory
            if not self.output_folder.get() and file_paths:
                self.output_folder.set(os.path.dirname(file_paths[0]))
    
    def add_more_pdfs(self):
        file_paths = filedialog.askopenfilenames(
            title="เพิ่มไฟล์ PDF",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_paths:
            for file_path in file_paths:
                self.add_pdf_to_list(file_path)
            # Auto-set output folder if not set
            if not self.output_folder.get():
                self.output_folder.set(os.path.dirname(file_paths[0]))
    
    def add_pdf_to_list(self, file_path):
        if file_path not in self.pdf_files:
            self.pdf_files.append(file_path)
            filename = os.path.basename(file_path)
            self.pdf_listbox.insert(tk.END, filename)
            self.update_file_count()
            # Auto-load first-page thumbnail into quick preview strip
            self._load_one_thumb(file_path)
    
    def clear_pdf_list(self):
        self.pdf_files.clear()
        self.pdf_listbox.delete(0, tk.END)
        self.update_file_count()
        # Clear quick preview strip
        self._quick_preview_photos.clear()
        if hasattr(self, '_qprev_cards'):
            self._qprev_cards.clear()
        self._qprev_selected = None
        for widget in self._qprev_inner.winfo_children():
            widget.destroy()
        self._qprev_frame.grid_remove()


    # ── Quick preview helpers ──────────────────────────────────────────────

    def _load_one_thumb(self, pdf_path):
        """Load first-page thumbnail for pdf_path in a daemon thread.
        Calls _add_thumb_card() on the mainloop when ready.
        Safe to call from the main thread.
        """
        import threading as _t

        def _worker():
            try:
                doc = fitz.open(pdf_path)
                n_pages = len(doc)
                page = doc[0]
                # 72px tall thumbnail
                scale = 72 / (page.rect.height or 792)
                mat = fitz.Matrix(scale, scale)
                pix = page.get_pixmap(matrix=mat)
                doc.close()

                img = Image.open(io.BytesIO(pix.tobytes("ppm")))
                # Keep aspect ratio, max 72px tall
                img.thumbnail((60, 72), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)

                # Must update UI on mainloop
                self.root.after(0, lambda: self._add_thumb_card(pdf_path, photo, n_pages))
            except Exception as e:
                print(f"[WARN] quick preview {os.path.basename(pdf_path)}: {e}")

        _t.Thread(target=_worker, daemon=True).start()

    def _add_thumb_card(self, pdf_path, photo, n_pages):
        """Add one thumbnail card to the quick preview strip (mainloop only).
        Clicking the card selects that PDF in the listbox and loads its preview.
        """
        # Keep reference — Python GC will delete it otherwise
        self._quick_preview_photos[pdf_path] = photo

        fname = os.path.basename(pdf_path)
        short = fname if len(fname) <= 16 else fname[:13] + "..."

        # ── Card frame ────────────────────────────────────────────────────
        card = tk.Frame(self._qprev_inner, bg='#1e293b',
                        relief='flat', bd=0, padx=4, pady=4,
                        cursor='hand2')
        card.pack(side=tk.LEFT, padx=4, pady=4)

        img_lbl = tk.Label(card, image=photo, bg='#1e293b', cursor='hand2')
        img_lbl.pack()

        name_lbl = tk.Label(card, text=short, bg='#1e293b', fg='#cbd5e1',
                            font=('Segoe UI', 7), wraplength=68)
        name_lbl.pack()

        pg_lbl = tk.Label(card,
                          text=f"{n_pages} page{'s' if n_pages != 1 else ''}",
                          bg='#1e293b', fg='#64748b', font=('Segoe UI', 7))
        pg_lbl.pack()

        # ── Hover + click helpers ─────────────────────────────────────────
        all_widgets = (card, img_lbl, name_lbl, pg_lbl)

        def _on_enter(e, widgets=all_widgets):
            for w in widgets:
                w.config(bg='#2d3f55')

        def _on_leave(e, widgets=all_widgets):
            is_sel = getattr(self, '_qprev_selected', None) == pdf_path
            col = '#1a3a5c' if is_sel else '#1e293b'
            for w in widgets:
                w.config(bg=col)

        def _on_click(e, path=pdf_path, widgets=all_widgets):
            # Deselect previous card
            prev = getattr(self, '_qprev_selected', None)
            if prev and prev in getattr(self, '_qprev_cards', {}):
                for w in self._qprev_cards[prev]:
                    try:
                        w.config(bg='#1e293b')
                    except tk.TclError:
                        pass

            # Highlight this card
            self._qprev_selected = path
            for w in widgets:
                w.config(bg='#1a3a5c')

            # Select matching entry in the listbox
            try:
                idx = self.pdf_files.index(path)
                self.pdf_listbox.selection_clear(0, tk.END)
                self.pdf_listbox.selection_set(idx)
                self.pdf_listbox.activate(idx)
                self.pdf_listbox.see(idx)
            except ValueError:
                pass

            # Trigger full preview load (if method exists)
            if hasattr(self, 'load_previews'):
                self.load_previews()

        for w in all_widgets:
            w.bind('<Enter>', _on_enter)
            w.bind('<Leave>', _on_leave)
            w.bind('<Button-1>', _on_click)

        # ── Track cards for deselection ───────────────────────────────────
        if not hasattr(self, '_qprev_cards'):
            self._qprev_cards = {}
        self._qprev_cards[pdf_path] = all_widgets

        # ── Reveal the strip if not already visible ───────────────────────
        self._qprev_frame.grid()

    # ── End quick preview helpers ──────────────────────────────────────────


    def update_file_count(self):
        count = len(self.pdf_files)
        self.file_count_label.config(text=f"จำนวนไฟล์: {count}")
        
        # Update drop area appearance
        if count == 0:
            self.drop_area.delete(0, tk.END)
            if DRAG_DROP_AVAILABLE:
                self.drop_area.insert(tk.END, "  ลากไฟล์ PDF มาวางที่นี่...")
            else:
                self.drop_area.insert(tk.END, "  ใช้ปุ่มด้านบนเพื่อเลือกไฟล์")
            if self.current_theme == "dark":
                self.drop_area.config(fg='#94a3b8', bg='#1e293b')
            else:
                self.drop_area.config(fg='#64748b', bg='#ffffff')
        else:
            if self.current_theme == "dark":
                self.drop_area.config(fg='#f1f5f9', bg='#1e293b')
            else:
                self.drop_area.config(fg='#1e293b', bg='#ffffff')
    
    def setup_drag_drop(self):
        """Setup drag and drop functionality"""
        try:
            # Enable drag & drop on the drop area
            self.drop_area.drop_target_register(DND_FILES)
            self.drop_area.dnd_bind('<<Drop>>', self.on_drop)
            self.drop_area.dnd_bind('<<DragEnter>>', self.on_drag_enter)
            self.drop_area.dnd_bind('<<DragLeave>>', self.on_drag_leave)
            print("[OK] Drag & Drop enabled")
        except Exception as e:
            print(f"[WARN] Drag & Drop not available: {e}")
            print("You may need to install: pip install tkinterdnd2")
    
    def on_drag_enter(self, event):
        """Handle drag enter event"""
        if len(self.pdf_files) == 0:
            self.drop_area.delete(0, tk.END)
            self.drop_area.insert(tk.END, "  วางไฟล์ PDF ที่นี่...")
        self.drop_area.config(bg='#bfdbfe' if self.current_theme == 'light' else '#1e3a8a')
        self.root.update()
    
    def on_drag_leave(self, event):
        """Handle drag leave event"""
        if len(self.pdf_files) == 0:
            self.drop_area.delete(0, tk.END)
            self.drop_area.insert(tk.END, "  ลากไฟล์ PDF มาวางที่นี่...")
            self.drop_area.config(bg='#ffffff' if self.current_theme == 'light' else '#1e293b')
        else:
            self.drop_area.config(bg='#ffffff' if self.current_theme == 'light' else '#1e293b')
        self.root.update()
    
    def on_drop(self, event):
        """Handle file drop event"""
        try:
            # Get dropped files
            files = self.root.tk.splitlist(event.data)
            pdf_files_added = 0
            
            for file_path in files:
                # Remove braces if present (Windows format)
                file_path = file_path.strip('{}')
                
                # Check if it's a PDF file
                if file_path.lower().endswith('.pdf') and os.path.exists(file_path):
                    if file_path not in self.pdf_files:
                        self.add_pdf_to_list(file_path)
                        pdf_files_added += 1
                        
                        # Auto-set output folder if not set
                        if not self.output_folder.get():
                            self.output_folder.set(os.path.dirname(file_path))
            
            # Show feedback
            if pdf_files_added > 0:
                self.update_status_with_theme(f"เพิ่มไฟล์ PDF {pdf_files_added} ไฟล์แล้ว", "success")
            else:
                self.update_status_with_theme("ไม่พบไฟล์ PDF ที่ถูกต้อง", "warning")
                
        except Exception as e:
            self.update_status_with_theme(f"ข้อผิดพลาดในการลากไฟล์: {str(e)}", "error")
    
    def remove_selected_pdf(self):
        selection = self.pdf_listbox.curselection()
        if not selection:
            return
        index = selection[0]
        removed_path = self.pdf_files[index]
        del self.pdf_files[index]
        self.pdf_listbox.delete(index)
        self.update_file_count()

        # ── Sync quick preview strip ──────────────────────────────────────
        self._remove_thumb_card(removed_path)

    def _remove_thumb_card(self, pdf_path):
        """Remove a thumbnail card from the quick preview strip (mainloop only)."""
        # Destroy widgets associated with this path
        cards = getattr(self, '_qprev_cards', {})
        if pdf_path in cards:
            for widget in cards[pdf_path]:
                try:
                    widget.destroy()
                except tk.TclError:
                    pass
            del cards[pdf_path]

        # Clean up photo reference
        self._quick_preview_photos.pop(pdf_path, None)

        # Reset selection state if this was the selected card
        if getattr(self, '_qprev_selected', None) == pdf_path:
            self._qprev_selected = None

        # Hide strip if now empty
        if not self._quick_preview_photos:
            self._qprev_frame.grid_remove()

    def browse_output(self):
        folder_path = filedialog.askdirectory(title="เลือกโฟลเดอร์เก็บไฟล์")
        if folder_path:
            self.output_folder.set(folder_path)
            
    def convert_multiple_pdfs(self):
        if not self.pdf_files:
            messagebox.showerror("ข้อผิดพลาด", "กรุณาเลือกไฟล์ PDF อย่างน้อย 1 ไฟล์")
            return
            
        output_dir = self.output_folder.get()
        if not output_dir:
            messagebox.showerror("ข้อผิดพลาด", "กรุณาเลือกโฟลเดอร์เก็บไฟล์")
            return
            
        try:
            self.update_status_with_theme("กำลังแปลงไฟล์...", "info")
            self.root.update()
            
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)
            
            total_files = len(self.pdf_files)
            total_pages_all = 0
            converted_images_all = []
            
            # First pass: count total pages to be converted
            for pdf_file in self.pdf_files:
                try:
                    selected_pages = self.get_selected_pages_for_pdf(pdf_file)
                    total_pages_all += len(selected_pages)
                except:
                    continue
            
            current_page = 0
            
            # Convert each PDF
            for file_index, pdf_file in enumerate(self.pdf_files):
                try:
                    # Update current file label
                    filename = os.path.basename(pdf_file)
                    self.current_file_var.set(f"ไฟล์ที่ {file_index + 1}/{total_files}: {filename}")
                    self.root.update()
                    
                    # Open PDF
                    pdf_document = fitz.open(pdf_file)
                    total_pages = len(pdf_document)
                    
                    # Get PDF filename without extension
                    pdf_name = Path(pdf_file).stem
                    
                    # Get selected pages for this PDF
                    selected_pages = self.get_selected_pages_for_pdf(pdf_file)
                    
                    for page_num in range(total_pages):
                        # Check if this page should be converted
                        if (page_num + 1) not in selected_pages:
                            continue
                            
                        # Update progress
                        current_page += 1
                        progress = (current_page / total_pages_all) * 100
                        self.progress_var.set(progress)
                        self.status_label.config(text=f"แปลงหน้า {page_num + 1}/{total_pages} ของ {filename}...")
                        self.root.update()
                        
                        # Get page
                        page = pdf_document[page_num]
                        
                        # Render page to image
                        mat = fitz.Matrix(self.dpi.get() / 72, self.dpi.get() / 72)
                        pix = page.get_pixmap(matrix=mat)
                        
                        # Convert to PIL Image
                        img_data = pix.tobytes("ppm")
                        img = Image.open(io.BytesIO(img_data))
                        
                        # Save with selected format and custom naming
                        output_filename = self.generate_filename(pdf_file, page_num + 1)
                        output_path = os.path.join(output_dir, output_filename)
                        
                        # Save based on selected format
                        format_type = self.output_format.get()
                        if format_type == "JPG":
                            img.save(output_path, "JPEG", quality=self.quality.get(), optimize=True)
                        elif format_type == "PNG":
                            img.save(output_path, "PNG", compress_level=self.png_compression.get())
                        elif format_type == "WEBP":
                            img.save(output_path, "WEBP", quality=self.webp_quality.get(), 
                                   method=self.webp_method.get())
                        
                        converted_images_all.append(output_path)
                        
                    pdf_document.close()
                    
                except Exception as e:
                    print(f"Error converting {pdf_file}: {e}")
                    continue
            
            # Create ZIP file if requested
            zip_file_path = None
            if self.create_zip.get() and converted_images_all:
                zip_file_path = self.create_zip_file(converted_images_all, output_dir)
            
            # Delete individual files if requested and ZIP was created
            if self.create_zip.get() and self.delete_individual_files.get() and zip_file_path:
                self.delete_individual_image_files(converted_images_all)
            
            # Complete
            self.progress_var.set(100)
            self.current_file_var.set("")
            
            # Prepare success message
            success_msg = f"แปลงไฟล์สำเร็จ!\n\nจำนวนไฟล์: {total_files}\nจำนวนหน้าทั้งหมด: {len(converted_images_all)}\nโฟลเดอร์เก็บไฟล์: {output_dir}"
            
            if zip_file_path:
                success_msg += f"\nไฟล์ ZIP: {zip_file_path}"
            
            self.update_status_with_theme(f"แปลงสำเร็จ! ทั้งหมด {len(converted_images_all)} หน้า", "success")
            
            messagebox.showinfo("สำเร็จ", success_msg)
            
            # Ask if user wants to open output folder
            if messagebox.askyesno("เปิดโฟลเดอร์", "ต้องการเปิดโฟลเดอร์เก็บไฟล์หรือไม่?"):
                os.startfile(output_dir)
                
        except Exception as e:
            self.current_file_var.set("")
            self.update_status_with_theme("พร้อมทำงาน", "success")
            messagebox.showerror("ข้อผิดพลาด", f"เกิดข้อผิดพลาดระหว่างการแปลง:\n{str(e)}")
    
    def create_zip_file(self, image_files, output_dir):
        """Create ZIP file containing all converted images"""
        try:
            import zipfile
            
            zip_name = self.zip_name.get().strip()
            if not zip_name:
                zip_name = "converted_images"
            
            zip_path = os.path.join(output_dir, f"{zip_name}.zip")
            
            # Create ZIP file
            with zipfile.ZipFile(zip_path, 'w', compresslevel=self.zip_compression.get()) as zipf:
                for image_path in image_files:
                    if os.path.exists(image_path):
                        # Add file to ZIP with just the filename (not full path)
                        filename = os.path.basename(image_path)
                        zipf.write(image_path, filename)
            
            return zip_path
            
        except Exception as e:
            self.update_status_with_theme("เกิดข้อผิดพลาดในการสร้าง ZIP", "error")
            messagebox.showerror("ข้อผิดพลาด ZIP", f"ไม่สามารถสร้างไฟล์ ZIP: {str(e)}")
            return None
    
    def delete_individual_image_files(self, image_files):
        """Delete individual image files after ZIP creation"""
        try:
            deleted_count = 0
            for image_path in image_files:
                if os.path.exists(image_path):
                    os.remove(image_path)
                    deleted_count += 1
            
            self.update_status_with_theme(f"ลบไฟล์รูปภาพ {deleted_count} ไฟล์", "success")
            
        except Exception as e:
            self.update_status_with_theme("เกิดข้อผิดพลาดในการลบไฟล์", "warning")
            print(f"Error deleting files: {e}")
    
    def toggle_theme(self):
        """Toggle between light and dark theme"""
        self.dark_mode.set(not self.dark_mode.get())
        self.apply_theme()
    
    def apply_theme(self):
        """Apply the current theme to the application"""
        if self.dark_mode.get():
            self.current_theme = "dark"
            self.apply_dark_theme()
        else:
            self.current_theme = "light"
            self.apply_light_theme()
    
    def apply_light_theme(self):
        """Apply modern light theme (warm neutrals — same orange accent as dark)."""
        bg = '#FAFAF9'       # Stone 50
        card = '#FFFFFF'
        text = '#1C1917'     # Stone 900
        accent = '#EA580C'   # Orange 600 — same as dark mode
        border = '#E7E5E4'   # Stone 200

        self.root.configure(bg=bg)
        self.style.configure('.', background=bg, foreground=text)
        self.style.configure('TFrame', background=bg)
        self.style.configure('Card.TFrame', background=card)
        self.style.configure('TLabel', background=bg, foreground=text)
        self.style.configure('Title.TLabel', background=bg, foreground=text)
        self.style.configure('Heading.TLabel', background=bg, foreground=text)
        self.style.configure('Secondary.TLabel', background=bg, foreground='#78716C')
        self.style.configure('Info.TLabel', background=bg, foreground=accent)
        self.style.configure('TLabelFrame', background=card, foreground=text)
        self.style.configure('TLabelFrame.Label', background=card, foreground=accent)
        self.style.configure('TButton', background='#F5F5F4', foreground=text)
        self.style.map('TButton', background=[('active', '#E7E5E4'), ('pressed', '#D6D3D1')])
        self.style.configure('Accent.TButton', background=accent, foreground='#FFFFFF')
        self.style.map('Accent.TButton',
                      background=[('active', '#C2410C'), ('pressed', '#9A3412')],
                      foreground=[('active', '#FFFFFF'), ('pressed', '#FFFFFF')])
        self.style.configure('Ghost.TButton', background=bg, foreground='#78716C')
        self.style.map('Ghost.TButton', background=[('active', '#F5F5F4')], foreground=[('active', text)])
        self.style.configure('TEntry', fieldbackground=card, foreground=text)
        self.style.configure('TCheckbutton', background=bg, foreground=text)
        self.style.configure('TRadiobutton', background=bg, foreground=text)
        self.style.configure('TScale', background=bg, troughcolor='#D6D3D1', sliderlength=14)
        self.style.configure('Horizontal.TProgressbar', background=accent, troughcolor=border)
        self.style.configure('Vertical.TScrollbar', background='#D6D3D1', troughcolor=bg)
        self.style.configure('Horizontal.TScrollbar', background='#D6D3D1', troughcolor=bg)

        self.theme_button.config(text="Dark")
        self.root.title(self.get_text("title"))
        if hasattr(self, 'title_label'):
            self.title_label.config(text=self.get_text("title"))
        if hasattr(self, 'convert_button'):
            fmt = self.output_format.get()
            self.convert_button.config(text=f"{self.get_text('convert')} {fmt}")
        if hasattr(self, 'drop_area'):
            self.drop_area.config(bg=card, fg='#78716C', selectbackground=accent, selectforeground='#FFFFFF',
                                   highlightcolor=border, highlightbackground=border)
        if hasattr(self, 'preview_canvas'):
            self.preview_canvas.config(bg=card, highlightcolor=border, highlightbackground=border)

    def apply_dark_theme(self):
        """Apply premium dark theme — design system: Operation orange on dark (1C1917)."""
        bg = '#1C1917'       # Stone 900 — design system bg
        card = '#292524'     # Stone 800 — card surface
        text = '#F5F5F4'     # Stone 100 — foreground
        accent = '#EA580C'   # Orange 600 — primary CTA
        border = '#3C3836'   # Stone 700 — subtle border

        self.root.configure(bg=bg)
        self.style.configure('.', background=bg, foreground=text)
        self.style.configure('TFrame', background=bg)
        self.style.configure('Card.TFrame', background=card)
        self.style.configure('TLabel', background=bg, foreground=text)
        self.style.configure('Title.TLabel', background=bg, foreground=text)
        self.style.configure('Heading.TLabel', background=bg, foreground=text)
        self.style.configure('Secondary.TLabel', background=bg, foreground='#A8A29E')
        self.style.configure('Info.TLabel', background=bg, foreground=accent)
        self.style.configure('TLabelFrame', background=card, foreground=text)
        self.style.configure('TLabelFrame.Label', background=card, foreground=accent)
        self.style.configure('TButton', background=border, foreground=text)
        self.style.map('TButton', background=[('active', '#504945'), ('pressed', '#665C54')])
        self.style.configure('Accent.TButton', background=accent, foreground='#FFFFFF')
        self.style.map('Accent.TButton',
                      background=[('active', '#C2410C'), ('pressed', '#9A3412')],
                      foreground=[('active', '#FFFFFF'), ('pressed', '#FFFFFF')])
        self.style.configure('Ghost.TButton', background=bg, foreground='#A8A29E')
        self.style.map('Ghost.TButton', background=[('active', border)], foreground=[('active', text)])
        self.style.configure('TEntry', fieldbackground=card, foreground=text, insertcolor=text)
        self.style.configure('TCheckbutton', background=bg, foreground=text)
        self.style.configure('TRadiobutton', background=bg, foreground=text)
        self.style.configure('TScale', background=bg, troughcolor=border, sliderlength=14)
        self.style.configure('Horizontal.TProgressbar', background=accent, troughcolor=border, thickness=6)
        self.style.configure('Vertical.TScrollbar', background='#504945', troughcolor=bg)
        self.style.configure('Horizontal.TScrollbar', background='#504945', troughcolor=bg)

        self.theme_button.config(text="Light")
        if hasattr(self, 'drop_area'):
            self.drop_area.config(bg=card, fg='#A8A29E', selectbackground=accent, selectforeground='#FFFFFF',
                                   highlightcolor=border, highlightbackground=border)
        if hasattr(self, 'preview_canvas'):
            self.preview_canvas.config(bg=card, highlightcolor=border, highlightbackground=border)

    def get_theme_colors(self):
        if self.current_theme == "dark":
            return {
                'bg': '#1C1917',
                'fg': '#F5F5F4',
                'button_bg': '#3C3836',
                'entry_bg': '#292524',
                'select_bg': '#EA580C',
                'success': '#22C55E',
                'error': '#EF4444',
                'warning': '#F59E0B',
                'info': '#EA580C'
            }
        else:
            return {
                'bg': '#FAFAF9',
                'fg': '#1C1917',
                'button_bg': '#F5F5F4',
                'entry_bg': '#FFFFFF',
                'select_bg': '#EA580C',
                'success': '#16A34A',
                'error': '#DC2626',
                'warning': '#D97706',
                'info': '#EA580C'
            }
    
    def update_status_with_theme(self, message, color_type="normal"):
        """Update status label with theme-appropriate color"""
        colors = self.get_theme_colors()
        color_map = {
            'normal': colors['fg'],
            'success': colors['success'],
            'error': colors['error'],
            'warning': colors['warning'],
            'info': colors['info']
        }
        self.status_label.config(text=message, foreground=color_map.get(color_type, colors['fg']))

    def get_translations(self):
        """Get translations dictionary"""
        return {
            "thai": {
                "title": "PDF to JPG Converter",
                "select_pdf": "เลือกไฟล์ PDF",
                "output_folder": "โฟลเดอร์เก็บไฟล์",
                "settings": "ค่าการตั้งค่า",
                "dpi": "ความละเอียด (DPI)",
                "format": "รูปแบบไฟล์",
                "quality": "คุณภาพ",
                "naming": "การตั้งชื่อไฟล์",
                "preview": "การดูตัวอย่างหน้า PDF",
                "compression": "การบีบอัดไฟล์",
                "convert": "แปลง PDF เป็น",
                "ready": "พร้อมทำงาน",
                "success": "สำเร็จ",
                "error": "ข้อผิดพลาด",
                "warning": "คำเตือน",
                "info": "ข้อมูล"
            },
            "english": {
                "title": "PDF to JPG Converter",
                "select_pdf": "Select PDF Files",
                "output_folder": "Output Folder",
                "settings": "Settings",
                "dpi": "Resolution (DPI)",
                "format": "File Format",
                "quality": "Quality",
                "naming": "File Naming",
                "preview": "PDF Page Preview",
                "compression": "File Compression",
                "convert": "Convert PDF to",
                "ready": "Ready",
                "success": "Success",
                "error": "Error",
                "warning": "Warning",
                "info": "Information"
            }
        }

    def get_text(self, key):
        """Get translated text for current language"""
        translations = self.translations.get(self.current_language.get(), self.translations["thai"])
        return translations.get(key, key)

    def toggle_language(self):
        """Toggle between Thai and English"""
        current = self.current_language.get()
        if current == "thai":
            self.current_language.set("english")
            self.language_button.config(text="🌐 EN")
        else:
            self.current_language.set("thai")
            self.language_button.config(text="🌐 TH")
        self.apply_language()

    def apply_language(self):
        """Apply current language to UI elements"""
        if hasattr(self, 'title_label'):
            self.title_label.config(text=self.get_text("title"))

        self.root.title(self.get_text("title"))

        if hasattr(self, 'convert_button'):
            format_type = self.output_format.get()
            self.convert_button.config(text=f"{self.get_text('convert')} {format_type}")

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    app = PDFToJPGConverter()

    # Integrate batch processing
    try:
        from batch_processor import add_batch_processing_to_main_app
        add_batch_processing_to_main_app(app)
    except Exception as e:
        print(f"⚠ Batch processing not loaded: {e}")

    # Integrate scheduler
    try:
        from scheduler import add_scheduler_to_main_app
        add_scheduler_to_main_app(app)
    except Exception as e:
        print(f"⚠ Scheduler not loaded: {e}")

    app.run()

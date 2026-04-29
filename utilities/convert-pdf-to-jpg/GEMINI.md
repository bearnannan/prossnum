# GEMINI.md — PDF to JPG Converter: Agent Schema

> This is the schema document for the AI agent (Antigravity / Gemini) maintaining this project.
> It defines the project structure, wiki conventions, skill protocols, and operational workflows.
> Update this file whenever the project conventions change.

---

## Project Identity

| Field | Value |
|-------|-------|
| **App** | PDF to JPG Converter |
| **Stack** | Python 3.12+, Tkinter GUI, PyMuPDF (fitz), Pillow |
| **Entry Point** | `pdf_to_jpg_converter.py` |
| **Core Modules** | `batch_processor.py`, `scheduler.py` |
| **Agent Dir** | `.agent/` |
| **Wiki Dir** | `.agent/wiki/` |
| **Skills Dir** | `.agent/skills/` |

---

## Directory Layout

```
convertPDFtoJPG/
├── pdf_to_jpg_converter.py   # Main app + GUI (PDFToJPGConverter class)
├── batch_processor.py        # BatchProcessor — multi-file, threaded
├── scheduler.py              # TaskScheduler — time-based triggers
├── requirements.txt          # pip dependencies
├── GEMINI.md                 # THIS FILE — agent schema
├── .agent/
│   ├── wiki/
│   │   ├── index.md          # Content catalog (LLM-maintained)
│   │   └── log.md            # Chronological append-only log
│   └── skills/               # Project-local skill files (SKILL.md)
├── Memento-Skills/           # Reference: self-evolving skill framework
├── caveman/                  # Reference: token-efficient CLI
├── cliTokenKill/             # Reference: token pruning strategies
├── ui-ux-pro-max-skill/      # Reference: UI/UX design intelligence
└── llm-wiki.md               # Reference: wiki pattern documentation
```

---

## Core Architecture Rules

### 1. Conversion Pipeline
- **Entry**: `PDFToJPGConverter.convert_multiple_pdfs()` — never bypass this for single-file too
- **Page render**: always use `fitz.Matrix(dpi/72, dpi/72)` → `page.get_pixmap(matrix=mat)` → `pix.tobytes("ppm")` → `Image.open(io.BytesIO(...))`  
- **PhotoImage**: always use `ImageTk.PhotoImage(img)` — **never** `tk.PhotoImage(data=img.tobytes())`
- **Output format**: read from `app.output_format.get()` — supports JPG, PNG, WEBP

### 2. Threading Rules
- **All conversion work MUST run in a `threading.Thread(daemon=True)`** — never block the Tkinter mainloop
- Update UI from background threads only via `widget.after(0, callback)` — never call widget methods directly
- `batch_processor.py`: `process_sequential()` and `process_parallel()` both spawn background threads

### 3. UI Integration Points
- `self.btn_row` — the `ttk.Frame` holding all top-row buttons; inject new buttons here via `add_*_to_main_app()` functions
- `self.convert_button` — the main accent CTA
- `self.progress_var`, `self.current_file_var` — `tk.DoubleVar` / `tk.StringVar` for progress feedback
- `self.status_label` — use `app.update_status_with_theme(msg, "success"|"error"|"info"|"warning")` to update

### 4. Settings Variables (all on `PDFToJPGConverter` instance)
| Variable | Type | Default |
|----------|------|---------|
| `self.dpi` | `tk.IntVar` | 300 |
| `self.quality` | `tk.IntVar` | 95 |
| `self.output_format` | `tk.StringVar` | "JPG" |
| `self.png_compression` | `tk.IntVar` | 6 |
| `self.webp_quality` | `tk.IntVar` | 90 |
| `self.webp_method` | `tk.IntVar` | 4 |
| `self.output_folder` | `tk.StringVar` | "" |

---

## Wiki Protocol

The `.agent/wiki/` directory is an LLM-maintained knowledge base for this project.

### index.md — Content Catalog
- Updated on every code change, bug fix, or feature addition
- Format: `## Category` → `| Page | Summary | Last Updated |`
- Read this first when answering questions about the codebase

### log.md — Chronological Log
- Append-only; each entry starts with `## [YYYY-MM-DD] type | subject`
- Types: `feature`, `fix`, `refactor`, `audit`, `decision`
- Example: `## [2026-04-26] fix | Thumbnail PhotoImage bug (ImageTk)`

### When to write to wiki
| Trigger | Action |
|---------|--------|
| New feature merged | Add to `index.md`, append to `log.md` |
| Bug fixed | Append fix entry to `log.md` |
| Architecture decision | Create decision page, link from `index.md` |
| Module added | Add module entry to `index.md` |

---

## Skill Protocol

Skills in `.agent/skills/` follow the Memento-Skills pattern:

```
.agent/skills/<skill-name>/
├── SKILL.md          # Instructions + frontmatter (name, description, when_to_use)
└── examples/         # Optional usage examples
```

### SKILL.md Frontmatter
```yaml
---
name: skill-name
description: One sentence — what this skill does
when_to_use: Specific trigger conditions
version: 1.0.0
---
```

### Built-in Skills (active)
| Skill | Purpose |
|-------|---------|
| `pdf-conversion` | Core fitz conversion patterns |
| `batch-threading` | Background thread + UI-safe update patterns |
| `ui-integration` | How to inject buttons/widgets into the main app |
| `token-efficiency` | caveman + cliTokenKill patterns for lean LLM prompts |

---

## Operational Workflows

### Adding a New Feature
1. Read `index.md` to understand what already exists
2. Check relevant skill files in `.agent/skills/`
3. Implement following threading and UI integration rules above
4. Inject button via `add_*_to_main_app(app)` called in `__main__`
5. Update `index.md` and append to `log.md`

### Fixing a Bug
1. Check `log.md` — has this bug appeared before?
2. Reproduce → fix → test with `python -c "import ast; ast.parse(open('file.py').read())"`
3. For UI bugs: prefer `ImageTk.PhotoImage` over raw `tk.PhotoImage`
4. For encoding bugs on Windows: avoid Unicode emoji in `print()` — use ASCII `[OK]`, `[WARN]`
5. Append fix entry to `log.md`

### Code Audit
1. Run `python -c "import ast; ast.parse(...)"` on all `.py` files
2. Verify all threads are daemon and use `.after(0, ...)` for UI updates  
3. Verify no `time.sleep()` stubs remain in production paths
4. Check `log.md` for unresolved issues

---

## Windows-Specific Rules
- **Encoding**: always open files with `encoding='utf-8'` or set `PYTHONUTF8=1`
- **Print**: no Unicode emoji in `print()` — Windows CP1252 will crash. Use `[OK]`, `[WARN]`, `[ERR]`
- **Paths**: use `Path()` from `pathlib` — never string concatenation with `\\`
- **os.startfile**: available on Windows for opening folders post-conversion

---

## External Tools Available

| Tool | Location | Use For |
|------|----------|---------|
| Memento-Skills | `Memento-Skills/` | Self-evolving skill framework reference |
| caveman | `caveman/` | Token-efficient context compression |
| cliTokenKill | `cliTokenKill/` | Prune stale context before LLM calls |
| ui-ux-pro-max-skill | `ui-ux-pro-max-skill/` | UI/UX design intelligence rules |
| FossFLOW | `FossFLOW/` | Isometric diagram reference |
| llm-wiki.md | root | Wiki pattern documentation |

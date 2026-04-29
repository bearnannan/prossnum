#!/usr/bin/env python3
"""
Advanced Scheduler Module for PDF to JPG Converter
Provides scheduled processing capabilities with time-based automation
"""

import os
import json
import time
import threading
import io
from datetime import datetime, timedelta
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image
import fitz  # PyMuPDF

class TaskScheduler:
    def __init__(self, main_app):
        self.main_app = main_app
        self.scheduled_tasks = []
        self.scheduler_running = False
        self.scheduler_thread = None
        self._stop_event = threading.Event()  # for clean shutdown
        self._badge = None   # set by add_scheduler_to_main_app

        # Task settings
        self.enable_scheduler = tk.BooleanVar(value=False)
        self.check_interval = tk.IntVar(value=60)  # seconds between checks
        self.auto_start = tk.BooleanVar(value=False)

    def _update_badge(self):
        """Refresh the task-count badge in the main toolbar (safe from any thread)."""
        badge = self._badge
        if badge is None:
            return
        n = len(self.scheduled_tasks)

        def _apply():
            try:
                if n > 0:
                    badge.config(text=f"[{n} task{'s' if n != 1 else ''}]")
                    badge.pack(side=tk.LEFT, padx=(0, 6))
                else:
                    badge.pack_forget()
            except tk.TclError:
                pass

        try:
            self.main_app.root.after(0, _apply)
        except Exception:
            pass

    def create_scheduler_window(self):
        """Create scheduler window"""
        self.scheduler_window = tk.Toplevel(self.main_app.root)
        self.scheduler_window.title("Task Scheduler")
        self.scheduler_window.geometry("700x500")
        self.scheduler_window.transient(self.main_app.root)
        self.scheduler_window.grab_set()
        
        # Configure style
        self.scheduler_window.configure(bg=self.main_app.get_theme_colors()['bg'])
        
        self.setup_scheduler_ui()
        
    def setup_scheduler_ui(self):
        """Setup scheduler UI"""
        # Main container
        main_frame = ttk.Frame(self.scheduler_window, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Task Scheduler", 
                                 font=('Arial', 14, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Settings Frame
        settings_frame = ttk.LabelFrame(main_frame, text="Scheduler Settings", padding="10")
        settings_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Enable scheduler
        ttk.Checkbutton(settings_frame, text="Enable Scheduler", 
                       variable=self.enable_scheduler, command=self.toggle_scheduler).pack(anchor=tk.W, pady=5)
        
        # Check interval
        interval_frame = ttk.Frame(settings_frame)
        interval_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(interval_frame, text="Check Interval (minutes):").pack(side=tk.LEFT, padx=5)
        interval_spinbox = ttk.Spinbox(interval_frame, from_=1, to=1440, textvariable=self.check_interval, width=10)
        interval_spinbox.pack(side=tk.LEFT, padx=5)
        
        ttk.Label(interval_frame, text=f"({self.check_interval.get()} hours)").pack(side=tk.LEFT, padx=5)
        
        # Auto-start
        ttk.Checkbutton(settings_frame, text="Auto-start on application launch", 
                       variable=self.auto_start).pack(anchor=tk.W, pady=5)
        
        # Task Management Frame
        task_frame = ttk.LabelFrame(main_frame, text="Scheduled Tasks", padding="10")
        task_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Task controls
        task_controls = ttk.Frame(task_frame)
        task_controls.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(task_controls, text="Add Task", 
                  command=self.add_task).pack(side=tk.LEFT, padx=5)
        ttk.Button(task_controls, text="Edit Task", 
                  command=self.edit_task).pack(side=tk.LEFT, padx=5)
        ttk.Button(task_controls, text="Delete Task", 
                  command=self.delete_task).pack(side=tk.LEFT, padx=5)
        ttk.Button(task_controls, text="Save Tasks", 
                  command=self.save_tasks).pack(side=tk.LEFT, padx=5)
        ttk.Button(task_controls, text="Load Tasks",
                  command=self.load_tasks).pack(side=tk.LEFT, padx=5)
        
        # Task list
        list_frame = ttk.Frame(task_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Create treeview for tasks
        self.task_tree = ttk.Treeview(list_frame, columns=('name', 'type', 'schedule', 'status'), 
                                      yscrollcommand=scrollbar.set)
        self.task_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.task_tree.yview)
        
        # Configure columns
        self.task_tree.heading('#0', text='Task Name')
        self.task_tree.heading('#1', text='Type')
        self.task_tree.heading('#2', text='Schedule')
        self.task_tree.heading('#3', text='Status')
        
        self.task_tree.column('#0', width=200)
        self.task_tree.column('#1', width=100)
        self.task_tree.column('#2', width=150)
        self.task_tree.column('#3', width=100)
        
        # Status Frame
        status_frame = ttk.LabelFrame(main_frame, text="Scheduler Status", padding="10")
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Status display
        status_display = ttk.Frame(status_frame)
        status_display.pack(fill=tk.X)
        
        self.status_label = ttk.Label(status_display, text="Scheduler Stopped", foreground="red")
        self.status_label.pack(side=tk.LEFT)
        
        self.next_run_label = ttk.Label(status_display, text="")
        self.next_run_label.pack(side=tk.RIGHT)
        
        # Action buttons
        action_frame = ttk.Frame(main_frame)
        action_frame.pack(fill=tk.X, pady=10)
        
        self.start_button = ttk.Button(action_frame, text="Start Scheduler", 
                                     command=self.start_scheduler)
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.stop_button = ttk.Button(action_frame, text="Stop Scheduler", 
                                     command=self.stop_scheduler, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(action_frame, text="Run Now", 
                  command=self.run_all_tasks).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="Close", 
                  command=self.close_scheduler_window).pack(side=tk.RIGHT, padx=5)
        
        # Update task list
        self.update_task_list()
    
    def toggle_scheduler(self):
        """Toggle scheduler on/off"""
        if self.enable_scheduler.get():
            self.start_scheduler()
        else:
            self.stop_scheduler()
    
    def add_task(self):
        """Add a new scheduled task"""
        self.create_task_dialog()
    
    def create_task_dialog(self, task_data=None):
        """Create task dialog for adding/editing tasks"""
        dialog = tk.Toplevel(self.scheduler_window)
        dialog.title("Add Task" if not task_data else "Edit Task")
        dialog.geometry("400x400")
        dialog.transient(self.scheduler_window)
        dialog.grab_set()
        
        # Configure style
        dialog.configure(bg=self.main_app.get_theme_colors()['bg'])
        
        # Main frame
        main_frame = ttk.Frame(dialog, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Task name
        ttk.Label(main_frame, text="Task Name:").pack(anchor=tk.W, pady=5)
        name_entry = ttk.Entry(main_frame, width=40)
        name_entry.pack(fill=tk.X, pady=5)
        
        # Task type
        ttk.Label(main_frame, text="Task Type:").pack(anchor=tk.W, pady=5)
        type_var = tk.StringVar(value="folder_watch")
        type_combo = ttk.Combobox(main_frame, textvariable=type_var, 
                                    values=["folder_watch", "scheduled_conversion", "recurring"])
        type_combo.pack(fill=tk.X, pady=5)
        
        # Schedule type
        ttk.Label(main_frame, text="Schedule Type:").pack(anchor=tk.W, pady=5)
        schedule_var = tk.StringVar(value="daily")
        schedule_combo = ttk.Combobox(main_frame, textvariable=schedule_var, 
                                       values=["once", "daily", "weekly", "monthly"])
        schedule_combo.pack(fill=tk.X, pady=5)
        
        # Time settings
        time_frame = ttk.Frame(main_frame)
        time_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(time_frame, text="Time:").pack(side=tk.LEFT, padx=5)
        time_entry = ttk.Entry(time_frame, width=10)
        time_entry.pack(side=tk.LEFT, padx=5)
        time_entry.insert(0, "09:00")
        
        ttk.Label(time_frame, text="Date:").pack(side=tk.LEFT, padx=5)
        date_entry = ttk.Entry(time_frame, width=10)
        date_entry.pack(side=tk.LEFT, padx=5)
        date_entry.insert(0, datetime.now().strftime("%Y-%m-%d"))
        
        # Folder/Files selection
        ttk.Label(main_frame, text="Source:").pack(anchor=tk.W, pady=5)
        source_entry = ttk.Entry(main_frame, width=40)
        source_entry.pack(fill=tk.X, pady=5)
        
        ttk.Button(main_frame, text="Browse Folder", 
                  command=lambda: self.browse_source(source_entry)).pack(pady=5)
        
        # Output settings
        ttk.Label(main_frame, text="Output Folder:").pack(anchor=tk.W, pady=5)
        output_entry = ttk.Entry(main_frame, width=40)
        output_entry.pack(fill=tk.X, pady=5)
        
        ttk.Button(main_frame, text="Browse Folder", 
                  command=lambda: self.browse_output(output_entry)).pack(pady=5)
        
        # Apply settings from main app
        ttk.Label(main_frame, text="Use Current Settings:").pack(anchor=tk.W, pady=5)
        ttk.Checkbutton(main_frame, text="Apply current conversion settings").pack(anchor=tk.W, pady=5)
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(button_frame, text="Save Task", 
                  command=lambda: self.save_task_from_dialog(
                      name_entry.get(), type_var.get(), schedule_var.get(),
                      time_entry.get(), date_entry.get(), source_entry.get(), 
                      output_entry.get(), dialog)).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", 
                  command=dialog.destroy).pack(side=tk.RIGHT, padx=5)
        
        # Pre-fill if editing
        if task_data:
            name_entry.insert(0, task_data['name'])
            type_var.set(task_data['type'])
            schedule_var.set(task_data['schedule'])
            time_entry.insert(0, task_data['time'])
            date_entry.insert(0, task_data['date'])
            source_entry.insert(0, task_data['source'])
            output_entry.insert(0, task_data['output'])
    
    def browse_source(self, entry_widget):
        """Browse for source folder"""
        folder_path = filedialog.askdirectory(title="Select Source Folder")
        if folder_path:
            entry_widget.delete(0, tk.END)
            entry_widget.insert(0, folder_path)
    
    def browse_output(self, entry_widget):
        """Browse for output folder"""
        folder_path = filedialog.askdirectory(title="Select Output Folder")
        if folder_path:
            entry_widget.delete(0, tk.END)
            entry_widget.insert(0, folder_path)
    
    def save_task_from_dialog(self, name, task_type, schedule, time, date, source, output, dialog):
        """Save task from dialog and add to list"""
        task_data = {
            'name': name,
            'type': task_type,
            'schedule': schedule,
            'time': time,
            'date': date,
            'source': source,
            'output': output,
            'status': 'pending',
            'created': datetime.now().isoformat(),
            'last_run': None,
            'next_run': None,
        }

        self.scheduled_tasks.append(task_data)
        self.update_task_list()
        self._update_badge()
        dialog.destroy()

        # Save tasks to file
        self.save_tasks()

    def edit_task(self):
        """Edit selected task"""
        selection = self.task_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a task to edit")
            return

        item = self.task_tree.item(selection[0])
        task_index = selection[0]
        task_data = self.scheduled_tasks[task_index]

        # Remove old task first (new one saved via save_task_from_dialog)
        del self.scheduled_tasks[task_index]
        self._update_badge()
        self.save_tasks()

        # Open dialog pre-filled with old values
        self.create_task_dialog(task_data)
        self.update_task_list()


    def delete_task(self):
        """Delete selected task"""
        selection = self.task_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a task to delete")
            return

        if messagebox.askyesno("Delete Task", "Are you sure you want to delete this task?"):
            task_index = selection[0]
            del self.scheduled_tasks[task_index]
            self.update_task_list()
            self._update_badge()
            self.save_tasks()

    def update_task_list(self):
        """Update task list display"""
        # Clear existing items
        for item in self.task_tree.get_children():
            self.task_tree.delete(item)
        
        # Add tasks
        for task in self.scheduled_tasks:
            # Calculate next run time
            next_run = self.calculate_next_run(task)
            
            self.task_tree.insert('', 'end', values=(
                task['name'],
                task['type'],
                f"{task['schedule']} at {task['time']}",
                task['status']
            ))
            
            # Store task reference for next run time
            task['next_run'] = next_run
    
    def calculate_next_run(self, task):
        """Calculate next run time for a task"""
        now = datetime.now()
        
        if task['schedule'] == 'once':
            # One-time task - run at specified time
            try:
                run_datetime = datetime.strptime(f"{task['date']} {task['time']}", "%Y-%m-%d %H:%M")
                if run_datetime > now:
                    return run_datetime
                else:
                    return None  # Already passed
            except:
                return None
        
        elif task['schedule'] == 'daily':
            # Daily task - run at specified time every day
            try:
                run_time = datetime.strptime(task['time'], "%H:%M").time()
                run_date = now.date()
                run_datetime = datetime.combine(run_date, run_time)
                
                if run_datetime <= now:
                    run_datetime += timedelta(days=1)
                
                return run_datetime
            except:
                return None
        
        elif task['schedule'] == 'weekly':
            # Weekly task - run on specified day and time
            # For simplicity, run every 7 days at specified time
            try:
                run_time = datetime.strptime(task['time'], "%H:%M").time()
                run_datetime = datetime.combine(now.date(), run_time)
                
                # Add 7 days to get next week
                run_datetime += timedelta(days=7)
                
                return run_datetime
            except:
                return None
        
        elif task['schedule'] == 'monthly':
            # Monthly task - run on same day each month
            try:
                run_time = datetime.strptime(task['time'], "%H:%M").time()
                
                # Calculate next month
                if now.month == 12:
                    next_month = now.replace(year=now.year + 1, month=1)
                else:
                    next_month = now.replace(month=now.month + 1)
                
                run_datetime = datetime.combine(next_month.date(), run_time)
                return run_datetime
            except:
                return None
        
        return None
    
    # ── Thread-safe UI helper ────────────────────────────────────────────
    def _notify(self, fn):
        """Schedule fn() on the Tkinter mainloop — safe from any thread."""
        self.main_app.root.after(0, fn)

    def start_scheduler(self):
        """Start the scheduler background thread."""
        if self.scheduler_running:
            return

        self._stop_event.clear()
        self.scheduler_running = True

        if hasattr(self, 'status_label'):
            self.status_label.config(text="Scheduler Running", foreground="green")
        if hasattr(self, 'start_button'):
            self.start_button.config(state=tk.DISABLED)
        if hasattr(self, 'stop_button'):
            self.stop_button.config(state=tk.NORMAL)

        self.scheduler_thread = threading.Thread(
            target=self.scheduler_loop, daemon=True, name="SchedulerLoop"
        )
        self.scheduler_thread.start()

    def stop_scheduler(self):
        """Signal the scheduler to stop — non-blocking (no join on mainloop thread)."""
        self.scheduler_running = False
        self._stop_event.set()  # wakes the sleeping loop immediately

        if hasattr(self, 'status_label'):
            self.status_label.config(text="Scheduler Stopped", foreground="red")
        if hasattr(self, 'start_button'):
            self.start_button.config(state=tk.NORMAL)
        if hasattr(self, 'stop_button'):
            self.stop_button.config(state=tk.DISABLED)

    def scheduler_loop(self):
        """Main scheduler loop — runs in background thread.
        Checks every second whether the stop_event is set (fast shutdown),
        and actually evaluates tasks every check_interval seconds.
        """
        elapsed = 0
        interval = max(1, self.check_interval.get())

        while not self._stop_event.is_set():
            # Sleep 1 s at a time so stop_event wakes us quickly
            self._stop_event.wait(timeout=1)
            if self._stop_event.is_set():
                break

            elapsed += 1
            if elapsed < interval:
                continue
            elapsed = 0

            try:
                for task in list(self.scheduled_tasks):  # copy to avoid mutation
                    if self._stop_event.is_set():
                        break
                    if task['status'] == 'pending':
                        next_run = task.get('next_run')
                        if next_run and datetime.now() >= next_run:
                            self.execute_task(task)
            except Exception as e:
                print(f"[ERR] Scheduler loop: {e}")
    
    def execute_task(self, task):
        """Execute a scheduled task from the scheduler thread."""
        def _set_running():
            task['status'] = 'running'
            if hasattr(self, 'task_tree'):
                self.update_task_list()
        self._notify(_set_running)

        success = True
        try:
            if task['type'] == 'folder_watch':
                self.execute_folder_watch_task(task)
            elif task['type'] == 'scheduled_conversion':
                self.execute_scheduled_conversion(task)
            elif task['type'] == 'recurring':
                self.execute_recurring_task(task)
        except Exception as e:
            print(f"[ERR] Task '{task['name']}': {e}")
            success = False

        def _set_done():
            task['status'] = 'completed' if success else 'failed'
            task['last_run'] = datetime.now().isoformat()
            if task['schedule'] != 'once':
                task['next_run'] = self.calculate_next_run(task)
            else:
                task['next_run'] = None
            if hasattr(self, 'task_tree'):
                self.update_task_list()
            self.save_tasks()
        self._notify(_set_done)
    
    def execute_folder_watch_task(self, task):
        """Execute folder watch task"""
        source_folder = task['source']
        output_folder = task['output']
        
        if not os.path.exists(source_folder):
            return
        
        # Find all PDF files
        pdf_files = []
        for root, dirs, files in os.walk(source_folder):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        
        # Process each PDF file
        for pdf_file in pdf_files:
            try:
                # Use main app's conversion logic
                self.process_pdf_file(pdf_file, output_folder)
            except Exception as e:
                print(f"Error processing {pdf_file}: {e}")
    
    def execute_scheduled_conversion(self, task):
        """Execute scheduled conversion task"""
        source = task['source']
        output = task['output']
        
        if os.path.isfile(source) and source.lower().endswith('.pdf'):
            self.process_pdf_file(source, output)
    
    def execute_recurring_task(self, task):
        """Execute recurring task — same as folder_watch for now."""
        self.execute_folder_watch_task(task)

    def process_pdf_file(self, pdf_file, output_folder):
        """Convert a single PDF using main app's current settings."""
        print(f"[OK] Scheduler converting: {os.path.basename(pdf_file)} -> {output_folder}")
        os.makedirs(output_folder, exist_ok=True)

        app = self.main_app
        dpi             = app.dpi.get()
        quality         = app.quality.get()
        output_format   = app.output_format.get()
        png_compression = app.png_compression.get()
        webp_quality    = app.webp_quality.get()
        webp_method     = app.webp_method.get()

        doc = fitz.open(pdf_file)
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                mat  = fitz.Matrix(dpi / 72, dpi / 72)
                pix  = page.get_pixmap(matrix=mat)

                img_data = pix.tobytes("ppm")
                img      = Image.open(io.BytesIO(img_data))

                # Use main app filename generator if available
                if hasattr(app, 'generate_filename'):
                    out_name = app.generate_filename(pdf_file, page_num + 1)
                else:
                    stem = Path(pdf_file).stem
                    ext  = output_format.lower() if output_format != 'JPG' else 'jpg'
                    out_name = f"{stem}_page_{page_num + 1:03d}.{ext}"

                out_path = os.path.join(output_folder, out_name)

                if output_format == 'JPG':
                    img.save(out_path, 'JPEG', quality=quality, optimize=True)
                elif output_format == 'PNG':
                    img.save(out_path, 'PNG', compress_level=png_compression)
                elif output_format == 'WEBP':
                    img.save(out_path, 'WEBP', quality=webp_quality, method=webp_method)
                else:
                    img.save(out_path, 'JPEG', quality=quality, optimize=True)
        finally:
            doc.close()
    
    def run_all_tasks(self):
        """Run all pending tasks immediately (in a background thread)."""
        if not self.scheduled_tasks:
            messagebox.showinfo("No Tasks", "No scheduled tasks found")
            return

        pending = [t for t in self.scheduled_tasks if t['status'] == 'pending']
        if not pending:
            messagebox.showinfo("No Pending Tasks", "All tasks are already completed or running")
            return

        if messagebox.askyesno("Run All Tasks",
                               f"Run {len(pending)} pending task(s) now?"):
            def _run():
                for task in pending:
                    if not self.scheduler_running and self._stop_event.is_set():
                        break
                    self.execute_task(task)
            threading.Thread(target=_run, daemon=True).start()
    
    def save_tasks(self):
        """Save tasks to file"""
        tasks_file = os.path.join(os.path.dirname(__file__), "scheduled_tasks.json")
        
        try:
            with open(tasks_file, 'w', encoding='utf-8') as f:
                json.dump(self.scheduled_tasks, f, indent=2, ensure_ascii=False)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save tasks: {str(e)}")
    
    def load_tasks(self):
        """Load tasks from file"""
        tasks_file = os.path.join(os.path.dirname(__file__), "scheduled_tasks.json")
        
        if not os.path.exists(tasks_file):
            messagebox.showinfo("No Tasks File", "No saved tasks found")
            return
        
        try:
            with open(tasks_file, 'r', encoding='utf-8') as f:
                self.scheduled_tasks = json.load(f)
            
            self.update_task_list()
            messagebox.showinfo("Success", f"Loaded {len(self.scheduled_tasks)} tasks")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load tasks: {str(e)}")
    
    def update_next_run_display(self):
        """Update next run time display"""
        if not self.scheduled_tasks:
            self.next_run_label.config(text="")
            return
        
        # Find next upcoming task
        next_runs = []
        for task in self.scheduled_tasks:
            if task['next_run']:
                next_runs.append((task['next_run'], task['name']))
        
        if next_runs:
            next_runs.sort()
            next_run, task_name = next_runs[0]
            time_str = next_run.strftime("%Y-%m-%d %H:%M")
            self.next_run_label.config(text=f"Next: {task_name} at {time_str}")
        else:
            self.next_run_label.config(text="No upcoming tasks")
    
    def close_scheduler_window(self):
        """Close scheduler window — ask if scheduler is still running."""
        if self.scheduler_running:
            if not messagebox.askyesno(
                "Scheduler Running",
                "Scheduler is running in the background.\n"
                "Stop it and close the window?"
            ):
                return
            self.stop_scheduler()   # non-blocking — sets _stop_event
        self.scheduler_window.destroy()


# Integration function to add scheduler to main app
def add_scheduler_to_main_app(main_app):
    """Add scheduler functionality to main application."""
    scheduler = TaskScheduler(main_app)

    # ── Auto-load saved tasks silently ────────────────────────────────────
    tasks_file = Path(__file__).parent / "scheduled_tasks.json"
    if tasks_file.exists():
        try:
            with open(tasks_file, 'r', encoding='utf-8') as f:
                scheduler.scheduled_tasks = json.load(f)
            n = len(scheduler.scheduled_tasks)
            print(f"[OK] Scheduler: loaded {n} task(s) from scheduled_tasks.json")
        except Exception as e:
            print(f"[WARN] Scheduler: could not load tasks: {e}")

    # ── Schedule button in toolbar ─────────────────────────────────────────
    btn_row = main_app.btn_row
    ttk.Button(
        btn_row,
        text="Schedule",
        command=scheduler.create_scheduler_window
    ).pack(side=tk.LEFT, padx=(0, 6))

    # ── Status badge: always created, visible only when tasks > 0 ───────────
    try:
        n_loaded = len(scheduler.scheduled_tasks)
        badge = tk.Label(
            btn_row,
            text=f"[{n_loaded} task{'s' if n_loaded != 1 else ''}]",
            bg='#2563eb', fg='white',
            font=('Segoe UI', 8, 'bold'),
            padx=4, pady=1
        )
        if n_loaded > 0:
            badge.pack(side=tk.LEFT, padx=(0, 6))
        # Store ref on scheduler so _update_badge() can reach it
        scheduler._badge = badge
    except Exception:
        pass

    # ── Auto-start if setting says so ─────────────────────────────────────
    if scheduler.auto_start.get():
        scheduler.start_scheduler()

    # ── On-close: graceful stop (non-blocking, daemon thread exits itself) ─
    original_destroy = main_app.root.destroy

    def _on_close():
        if scheduler.scheduler_running:
            scheduler.stop_scheduler()   # just sets _stop_event, returns immediately
        original_destroy()

    main_app.root.protocol("WM_DELETE_WINDOW", _on_close)

    return scheduler

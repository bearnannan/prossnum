# PDF Merger Application

แอพพลิเคชันรวมไฟล์ PDF สำหรับ Windows

## การติดตั้ง

### วิธีที่ 1: ใช้งานแบบ Python (ต้องมี Python)

1. ติดตั้ง Python ถ้ายังไม่มีในเครื่อง
2. ติดตั้ง library ที่จำเป็น:
```bash
pip install -r requirements.txt
```
3. รันแอพพลิเคชัน:
```bash
python pdf_merger.py
```

### วิธีที่ 2: สร้างไฟล์ .exe (แนะนำ)

1. ดับเบิลคลิก `build.bat` เพื่อสร้างไฟล์ executable
2. รอจนกว่าการ build เสร็จสิ้น
3. รันไฟล์ `PDFMerger.exe` ที่ถูกสร้างขึ้น

หรือใช้คำสั่ง:
```bash
python build_exe.py
```

## การใช้งาน

1. เปิดแอพพลิเคชัน (PDFMerger.exe)
2. คลิก "Add PDF Files" เพื่อเลือกไฟล์ PDF ที่ต้องการรวม
3. จัดลำดับไฟล์โดยการลบ/เพิ่มไฟล์
4. กำหนดชื่อไฟล์ที่ต้องการบันทึกในช่อง "Output File"
5. คลิก "Merge PDFs" เพื่อรวมไฟล์

## ฟีเจอร์

- เลือกไฟล์ PDF หลายไฟล์ได้
- แสดงขนาดไฟล์และพาธ
- จัดลำดับไฟล์ง่ายๆ
- เลือกที่เก็บไฟล์ผลลัพธ์ได้
- แสดงสถานะและความคืบหน้า
- ป้องกัน error และแจ้งเตือน
- ไม่ต้องติดตั้ง Python (เมื่อใช้ .exe)

## ไฟล์ที่สร้าง

- `pdf_merger.py` - ซอร์สโค้ด Python
- `build.bat` - สคริปต์สร้าง .exe
- `build_exe.py` - สคริปต์สร้าง .exe (Python)
- `requirements.txt` - library ที่ต้องการ
- `PDFMerger.exe` - ไฟล์ executable (หลัง build)

## ตัวอย่างการใช้ pdftk (คำสั่งเดิม)

สำหรับผู้ที่ต้องการใช้คำสั่ง pdftk แบบดั้งเดิม:

```bash
cd "D:\Forth\Per Diem Claim Form\2569\4"

pdftk `
"Cash Advance Settlement Form01_03_-01_04_26.pdf" `
"Doc1.pdf" `
"MyDrive_Appsheet_data_ForthETR-444695704_Report_IN_OUT_6301110_202604003.pdf" `
"MyDrive_Appsheet_data_ForthETR-444695704_ReportRequestWorkOutSidePDF_e83c2001.pdf" `
cat output "Compiled Petty Cash Claim Forms.pdf"
```

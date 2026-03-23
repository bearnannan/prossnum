<<<<<<< HEAD
# Prossnum Progress Dashboard

ระบบติดตามความคืบหน้างานก่อสร้างฐานรากและเสาสัญญาณ รวมถึงงานติดตั้งระบบลูกข่าย อ.ห้วยกระเจา และ อ.เลาขวัญ จ.กาญจนบุรี เขต11 (เพชรบุรี)

## 📌 คุณสมบัติของระบบ (Features)

1. **ดึงข้อมูลเชื่อมต่อกับ Google Sheets แบบ Real-time**: 
   - ระบบจะอ่านข้อมูลล่าสุดจาก Google Sheets (ผ่าน Published CSV Data) ทุกครั้งที่มีการโหลดหน้าจอ ทำให้ไม่ต้องแก้โค้ดเมื่อมีการเปลี่ยนแปลงข้อมูลตาราง

2. **แดชบอร์ดแสดงผล (Progress Dashboard)**:
   - แสดงตัวเลขสรุปภาพรวมจำนวนสถานีทั้งหมดที่กำลังดำเนินการ และที่เสร็จสมบูรณ์แล้ว
   - แสดงแผนภูมิแท่ง (Bar Chart) เปรียบเทียบความคืบหน้าของแต่ละสถานี
   - แสดงพิกัดตำแหน่งสถานีต่างๆ ลงบนแผนที่ (Interactive Map by OpenStreetMap + Leaflet)

3. **แบ่งหมวดหมู่การทำงาน 2 ส่วน**:
   - **ข้อมูลสถานีเดิม (Station Data)**: สำหรับติดตามงานก่อสร้างฐานราก และงานติดตั้งโครงเสา
   - **ระบบลูกข่าย (Client System)**: สำหรับติดตามงานระบบไฟฟ้า, กราวด์, สาย Feeder ฯลฯ

4. **ระบบค้นหาและตัวกรอง (Search & Filters)**:
   - ค้นหาสถานีจากชื่อ หรืออำเภอ
   - กรองตาม Type ของสถานีความสูงเสา หรือสถานะการทำงาน (กำลังดำเนินการ/เสร็จสมบูรณ์)

5. **ระบบจัดการข้อมูล (Edit & Delete)**:
   - มีปุ่ม แก้ไข/ลบ ข้อมูลสำหรับพนักงาน เพื่อจัดการข้อมูลบนหน้าเว็บ

6. **ระบบออกรายงาน (Export Reports)**:
   - Export สรุปงานเป็นไฟล์ Text (`.txt`) สำหรับส่งรายงานประจำวัน
   - Export หน้าจอแดชบอร์ดเป็นไฟล์รูปภาพ (JPEG) หรือ PDF

## 🚀 การติดตั้งและรันโปรเจกต์ (Local Development)

### 1. ไฟล์ที่ต้องมี (Environment Variables)
โปรเจกต์นี้ใช้ `Next.js` และต้องการไฟล์ `.env.local` เพื่อระบุแหล่งข้อมูล (Google Sheets GID)
ให้สร้างไฟล์ชื่อ `.env.local` ไว้ในโฟลเดอร์ `webapp` โดยมีข้อมูลดังนี้:

```env
PUBLISHED_SHEET_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vS-x6wrhvu6tQUCeY4AHFlDPeHE2Jjkrrry5paIxNC4_McE8YYEFAOfAZowFurEsf-lyyVrkozKp4OE/pub?output=csv
GID_STATION_DATA=425872468
GID_CLIENT_SYSTEM=2070776408

// (ถ้ามีการใช้งาน Service Account สำหรับระบบแก้ไขข้อมูลให้เพิ่มตัวแปร GOOGLE_CLIENT_EMAIL และ GOOGLE_PRIVATE_KEY ด้วย)
```

> **ข้อกำหนด GID**:
> - `GID_STATION_DATA` (425872468) คือ รหัสชีตแผ่น "ข้อมูลสถานีเดิม" 
> - `GID_CLIENT_SYSTEM` (2070776408) คือ รหัสชีตแผ่น "ระบบลูกข่าย"

### 2. วิธีรันโปรเจกต์ในเครื่อง
เปิด Terminal แล้วทำตามขั้นตอนต่อไปนี้:

```bash
# 1. เข้าไปในโฟลเดอร์ webapp
cd webapp

# 2. ติดตั้ง Dependencies ทั้งหมด
npm install

# 3. รัน Development Server
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

## 🌐 การนำเข้าระบบขึ้น Vercel (Deployment)

การนำโปรเจกต์ขึ้นไปยัง Vercel (เว็บเซิร์ฟเวอร์ฟรี) สามารถทำได้ดังนี้:

1. นำโค้ดทั้งหมด (Commit & Push) ขึ้น GitHub ของคุณ
2. เข้าเว็บไซต์ [Vercel](https://vercel.com/) แล้วล็อกอินด้วย GitHub
3. กดปุ่ม `Add New > Project` แล้วเลือก Repository ชื่อ **prossnum** ของคุณ
4. ในขั้นตอน **Configure Project**:
   - Framework Preset: เลือก **Next.js**
   - Root Directory: เลือกโฟลเดอร์ **webapp**
5. ในหมวด **Environment Variables** ให้เพิ่มค่าทั้ง 3 ตัวเหมือนใน `.env.local`:
   - `PUBLISHED_SHEET_URL` = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS-x6wrhvu6tQUCeY4AHFlDPeHE2Jjkrrry5paIxNC4_McE8YYEFAOfAZowFurEsf-lyyVrkozKp4OE/pub?output=csv`
   - `GID_STATION_DATA` = `425872468`
   - `GID_CLIENT_SYSTEM` = `2070776408`
6. กดปุ่ม **Deploy**

**ข้อควรระวังเมื่อมีการเปลี่ยน GID:**
หากในอนาคตคุณนำชีตใหม่มาใส่ และ GID เปลี่ยนไป คุณต้องเข้าไปแก้ `GID_STATION_DATA` / `GID_CLIENT_SYSTEM` ในเมนู **Settings > Environment Variables** บนโปรเจกต์ Vercel แล้วกลับไปที่หน้า **Deployments** เลือก **Redeploy** เพื่อให้ Vercel อ่านค่า Environment ใหม่

## 📊 โครงสร้างข้อมูลตารางใน Google Sheets

เพื่อให้ระบบแสดงผลได้ไม่ผิดเพี้ยน, ตาราง Google Sheets ควรมีคอลัมน์ดังนี้ (นับจากซ้ายไปขวา A,B,C...):

### 1. Sheet: ข้อมูลสถานีเดิม (station_data)
- **อำเภอ**
- **ชื่อสถานี**
- **Type**
- **ฐานราก (%)**
- **งานติดตั้งเสา (%)**
- **Latitude** 
- **Longitude**
- **ความสูงเสา**
- **วันที่เริ่มงาน**
- **วันที่เสร็จงาน**
- **หมายเหตุ**

### 2. Sheet: ระบบลูกข่าย (ClientSystem)
- **อำเภอ**
- **ชื่อสถานี**
- **Latitude**
- **Longitude**
- **ความสูงเสา**
- **ระบบไฟฟ้า (%)**
- **ระยะสาย Main**
- **ระบบกราวด์ (%)**
- **AC Ω**
- **Equip Ω**
- **สาย Feeder (%)**
- **Yagi No**
- **SN**
- **ระยะ feed**
- **อุปกรณ์บนเสา (%)**
- **เครื่องวิทยุ (%)**
- **SN เครื่องวิทยุ MT680 Plus**
- **SN แบตเตอรี่ 50AH**
- **ค่า RSSI dBm**
- **งานเพิ่มเติม / ปัญหาอุปสรรค**
- **วันที่เริ่มงาน**
- **วันที่เสร็จงาน**

*หากมีการเพิ่ม/ลด หรือสลับคอลัมน์ใน Google Sheets จะต้องมาแก้ไข Mapping File ในโค้ดด้วยที่ไฟล์ `webapp/src/app/api/sheet-data/route.ts`*

---
©2026 Developed by Prossnum Team.
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> a87528c (implemented the Edit Logic, integrated it into the dashboard, and verified it with a browser subagent.)

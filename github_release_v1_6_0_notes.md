# 🛡️ v1.6.0 — PWA Offline Resilience & Security Hardening

## Release Title
**"ขอบฟ้าไร้สัญญาณ" — Offline First, Security First**

---

## ✨ What's New

### 📱 PWA Offline Resilience (Offline-First Infrastructure)

การทำงานบนพื้นที่ห่างไกลที่สัญญาณอินเทอร์เน็ตไม่เสถียรไม่ใช่ปัญหาอีกต่อไป ระบบสามารถบันทึกข้อมูลได้ต่อเนื่องและซิงค์ขึ้น Cloud โดยอัตโนมัติเมื่อเชื่อมต่อกลับมา

- **Centralized Offline Sync Engine** (`offline-sync.ts`)  
  คิวการบันทึกข้อมูล (Add/Edit/Delete) ถูกจัดเก็บใน IndexedDB รอซิงค์โดยอัตโนมัติ
  
- **Real-time Connectivity Monitor** (`useOfflineSync.ts`)  
  ตรวจจับสถานะ Online/Offline แบบ Real-time และ Trigger การซิงค์ทันทีเมื่อเน็ตกลับมา

- **SyncIndicator Component** (TopNavBar)  
  แสดงสถานะการเชื่อมต่อและจำนวนรายการที่รอซิงค์แบบ Glassmorphism พร้อมปุ่มซิงค์ Manual

- **Optimistic UI**  
  รายการที่บันทึกแบบออฟไลน์จะแสดงในตารางทันที พร้อม badge **"LOCAL"** สีส้มกะพริบ

- **SWR Cache Persistence**  
  ข้อมูลล่าสุดถูกบันทึกใน IndexedDB ทำให้เปิด App ขณะออฟไลน์ได้ทันที ไม่ต้องรอโหลด

### 🔒 Security Hardening

- **Key Rotation**: Supabase ใช้ระบบ JWT Keys ใหม่ (ECC P-256) พร้อม Publishable/Secret Key format ใหม่
- **Runtime Validation**: `google-sheets.ts` และ `supabase.ts` มีการตรวจสอบ secrets ตั้งแต่ start-up
- **Secret Leak Prevention**: ลบ `console.log` ที่พิมพ์ค่า environment variables ออกจาก debug scripts
- **Vercel Hardening**: ทุก environment variable ถูกตั้งค่าเป็น "Sensitive" ใน Vercel Dashboard

---

## 🔧 Files Changed

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/lib/offline-sync.ts` | ✨ NEW — Sync Engine |
| `src/hooks/useOfflineSync.ts` | ✨ NEW — Connectivity Hook |
| `src/components/SyncIndicator.tsx` | ✨ NEW — UI Indicator |
| `src/app/page.tsx` | 🔧 Optimistic UI + SWR Persistence |
| `src/components/StationModal.tsx` | 🔧 Offline-first mutation |
| `src/components/ClientSystemModal.tsx` | 🔧 Offline-first mutation |
| `src/components/DashboardTable.tsx` | 🔧 LOCAL badge for pending items |
| `src/components/TopNavBar.tsx` | 🔧 Integrated SyncIndicator |
| `src/lib/supabase.ts` | 🔒 New key format + validation |
| `src/lib/google-sheets.ts` | 🔒 Runtime secret validation |
| `test-sheets.js` | 🔒 Remove secret leak in logs |

---

## ⬆️ Upgrade Notes

> ถ้าคุณใช้ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แบบเก่า (JWT format `eyJ...`)  
> ให้อัปเดตเป็น format ใหม่ `sb_publishable_...` จาก Supabase Dashboard → API Keys → Publishable and secret API keys

---

*Released: April 2026 | Built with Next.js 16, Supabase, PWA, IndexedDB*

# RSSI Dataset Sync & Deduplication Tool

ชุดเครื่องมือดาวน์โหลดชุดข้อมูลจาก Google Drive อัตโนมัติลง Laptop พร้อมระบบตรวจสอบไฟล์ซ้ำซ้อน (SHA-256 Deduplication) และจัดโครงสร้างโฟลเดอร์สำหรับงานวิจัย

## โครงสร้างในโฟลเดอร์นี้
* `sync_dataset.bat` — ดับเบิลคลิกเพื่อรันบน Windows ได้ทันที
* `sync_dataset.sh` — สคริปต์รันบน Git Bash, macOS, WSL หรือ Linux
* `sync_dataset.py` — Engine หลักในการเชื่อมต่อ ดาวน์โหลด และตรวจสอบ SHA-256
* `google_drive_downloader.js` — สคริปต์ Google Apps Script (แยกอิสระ ปลอดภัย 100%)

## วิธีใช้งาน

### 1. ตั้งค่าความปลอดภัยก่อนใช้งานครั้งแรก (ทำครั้งเดียว)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env` แล้วระบุ Web App URL:
```env
DOWNLOADER_GAS_URL=https://script.google.com/macros/s/AKfycb.../exec
```
*(ไฟล์ `.env` จะถูกซ่อนและไม่ถูกอัปโหลดขึ้น Git เพื่อความปลอดภัย)*

### 2. ดับเบิลคลิกบน Windows
ดับเบิลคลิกที่ไฟล์ `sync_dataset.bat`

### 3. รันผ่าน Terminal / Command Line
```powershell
# ซิงค์และโหลดไฟล์ใหม่ทั้งหมด
python tools/dataset_sync/sync_dataset.py

# ตรวจสอบไฟล์ที่มีอยู่ในเครื่อง (ไม่โหลดใหม่)
python tools/dataset_sync/sync_dataset.py --verify
```

### 4. รันผ่าน npm (จาก Root โฟลเดอร์)
```bash
npm run sync:dataset
npm run verify:dataset
```

## ผลลัพธ์
* ไฟล์ข้อมูลทั้งหมดจะถูกจัดเก็บไว้ที่โฟลเดอร์ `dataset/`
* ประวัติการดาวน์โหลดและค่า Hash จะถูกบันทึกไว้ที่ `dataset/manifest.json`


# RSSI Web Logger: Minimalist Wi-Fi & GPS Telemetry System

A lightweight, mobile-first Web Application + Mobile Bridge pipeline for collecting synchronized Wi-Fi RSSI (dBm), MAC/BSSID, SSID, High-Precision GPS metrics, and research location notes directly on **iOS (iOS 17+)** and **Android**, with automated deployment on **Vercel** and automatic cloud synchronization to **Google Drive & Google Sheets**.

[ภาษาไทย (Thai Guide) คลิกที่นี่](#คู่มือการใช้งานภาษาไทย)

---

## Architecture Overview

1. **Vercel Cloud Deployment (`/api/*`):** Unified Serverless architecture hosting the Web Dashboard and processing telemetry streams (`/api/log`, `/api/sync-drive`, `/api/export`).
2. **Minimalist OLED Dark UI:** Pure black (`#000000`) theme with crisp hairline borders, high-contrast typography, and zero clutter designed for field researchers.
3. **Automatic Google Drive Sync:** Direct synchronization via Google Apps Script upon stopping a trip, backed by live on-screen toast feedback and automatic trip CSV archiving into Google Drive (`dataset/ios`, `dataset/android`, `dataset/web`).
4. **Hardware-Tied Device ID:** Deterministic device fingerprinting ensuring the participant code never changes on the same smartphone.
5. **Location & Research Notes:** Optional on-screen input for specifying building, floor, room, or zone notes seamlessly tagged to every telemetry row.
6. **Text-First & Zero Data Drain:** Stripped heavy map tile and canvas chart rendering to save cellular data (0 MB consumed on maps), prevent CPU thermal throttling, and ensure 100% precision.
7. **Zero Horizontal Overflow:** Mobile-first layout (max 440px) tailored for standard mobile viewports (320px–430px) without horizontal scrolling.
8. **Screen Keep-Awake:** Screen Wake Lock API prevents the phone display from sleeping during active field trips.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm start

# 3. Open dashboard
http://localhost:3000
```

---

## Deploying to Vercel

1. Push this project to your GitHub repository: [github.com/Kitsada4435/rssi-web-logger](https://github.com/Kitsada4435/rssi-web-logger)
2. Import the repository in [Vercel](https://vercel.com/new).
3. Click **Deploy** to obtain your live HTTPS URL (e.g. `https://rssi-web-logger.vercel.app`).
4. (Optional) Set `GOOGLE_DRIVE_WEBHOOK_URL` in Vercel Environment Variables.

---

## คู่มือการใช้งานภาษาไทย

### 1. วิธีติดตั้งฝั่งมือถือ (ทำครั้งเดียว)

#### สำหรับ iPhone / iPad (iOS 17+)
1. เปิดหน้าเว็บ Dashboard บน Safari: `https://rssi-web-logger.vercel.app`
2. กดดาวน์โหลดคำสั่งลัดจากแถบตัวช่วยส่งสัญญาณ (หรือสร้างเอง 4 บล็อกในแอป Shortcuts)
3. ตรวจสอบใน Shortcut: ใช้คำสั่ง **"รับเนื้อหาของ URL" (Get contents of URL)** แบบ `GET` และไม่มีเว้นวรรคหลังเครื่องหมาย `?`
4. ตั้งค่าสิทธิ์: `Settings` > `Privacy & Security` > `Location Services` > `Shortcuts` > เลือก **"While Using the App"**
5. ในหน้าแก้ไข Shortcut แตะปุ่ม `(i)` ด้านล่าง > แท็บ **ความเป็นส่วนตัว (Privacy)** > เลือก **"อนุญาตเสมอ" (Always Allow)**

#### สำหรับ Android
1. เปิดหน้าเว็บ Dashboard บน Chrome
2. กดปุ่ม **"🤖 โหลด Android APK"** บนแถบตรวจจับอุปกรณ์
3. ติดตั้งไฟล์ APK ลงเครื่อง และเปิดสิทธิ์ Location / Nearby Devices

---

### 2. วิธีเริ่มเก็บข้อมูลการเดินทาง (Trip Session)

1. เปิดหน้าเว็บ Dashboard บนเบราว์เซอร์
2. ตรวจสอบรหัสผู้เข้าร่วม (ระบบผูกรหัสฮาร์ดแวร์ประจำเครื่องถาวร หรือพิมพ์รหัสนักศึกษาของตนเองได้)
3. เลือกโหมดการเดินทาง (**เดิน 🚶 / ปั่น 🚲 / มอไซค์ 🛵 / รถ 🚗**)
4. *(ไม่บังคับ)* ระบุรายละเอียดสถานที่ เช่น `อาคารวิศวะ ชั้น 3`
5. กดปุ่มใหญ่ **"เริ่มบันทึก (START TRIP)"** (หน้าจอจะล็อกไม่ให้ดับอัตโนมัติ)
6. เริ่มตัวส่งสัญญาณ Wi-Fi:
   * **iOS:** สลับไปแอปคำสั่งลัดแล้วกดปุ่ม Play (▶) รัน **"Send RSSI Web"**
   * **Android:** เปิดแอป Companion แล้วกดปุ่ม **"START"**
7. ข้อมูล GPS + Wi-Fi RSSI จะแสดงผลสดบนหน้าจอแบบตัวเลขความคมชัดสูง
8. เมื่อเสร็จสิ้น กด **"หยุดบันทึก (STOP TRIP)"** 
   - ระบบจะส่งข้อมูลขึ้น **Google Drive ให้อัตโนมัติทันที** พร้อมขึ้นแถบแจ้งเตือนสีเขียว `✅ บันทึกเข้า Google Drive สำเร็จแล้ว (X จุด)`
   - สามารถกดปุ่ม **"📥 โหลดไฟล์ CSV"** เพื่อบันทึกสำรองในเครื่องได้ตลอดเวลา

---

### โครงสร้างไฟล์ในโปรเจกต์

```text
RSSI Web Logger/
├── plan.md                              # แผนงานและสถาปัตยกรรมระบบ
├── README.md                            # คู่มือการติดตั้งและใช้งาน (TH/EN)
├── NEXT_STEPS.md                        # สรุปขั้นตอนการทดสอบและจัดระเบียบ Drive
├── package.json                         # Node.js dependencies & scripts
├── server.js                            # Local Express API Server + SSE + Google Drive proxy
├── vercel.json                          # คอนฟิก Serverless Functions บน Vercel
├── Send Rssi Logger web.shortcut        # ไฟล์ Shortcut สำหรับ iOS
├── api/                                 # Serverless endpoints สำหรับ Vercel
│   ├── log.js                           # รวมศูนย์รับข้อมูล telemetry & ส่งต่อไป Google Drive
│   ├── sync-drive.js                    # ส่งข้อมูลแบบ Batch ขึ้น Google Drive / Google Sheets
│   ├── logs.js                          # Proxy endpoint สำหรับ backward compatibility
│   └── export.js                        # ส่งออกข้อมูล CSV
├── public/                              # หน้าเว็บ Minimalist Mobile Dashboard
│   ├── index.html                       # หน้าเว็บแบบ Minimalist Text-First Telemetry
│   ├── style.css                        # ธีม Minimalist OLED Dark Zero-Overflow
│   ├── app.js                           # ลอจิก Hardware ID, Polling Engine, Auto-Sync Drive
│   └── downloads/                       # ไฟล์ Bridge สำหรับผู้ใช้ดาวน์โหลด
│       ├── Send Rssi Logger web.shortcut
│       ├── rssi-logger-android.apk
│       └── macrodroid_guide.txt
└── scripts/
    ├── google_drive_script.js           # โค้ด Google Apps Script สำหรับวางใน Google Drive
    └── test_ping.py                     # สคริปต์จำลองยิงข้อมูลทดสอบ
```

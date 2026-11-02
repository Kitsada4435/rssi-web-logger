# RSSI Web Logger: Mobile-First Wi-Fi & GPS Telemetry System

A lightweight, mobile-first Web Application + Mobile Bridge pipeline for collecting synchronized Wi-Fi RSSI (dBm), MAC/BSSID, SSID, and High-Precision GPS metrics directly on **iOS (iOS 17+)** and **Android**, with automated deployment on **Vercel** and automatic cloud synchronization to **Google Drive & Google Sheets**.

[ภาษาไทย (Thai Guide) คลิกที่นี่](#คู่มือการใช้งานภาษาไทย)

---

## Architecture Overview

1. **Vercel Cloud Deployment (`/api/*`):** Serverless architecture hosting the Web Dashboard and receiving telemetry streams (`/api/log`, `/api/sync-drive`, `/api/export`).
2. **Automatic Google Drive Sync:** Direct synchronization via Google Apps Script upon stopping a trip, backed by live on-screen toast feedback and automatic trip CSV archiving.
3. **Hardware-Tied Device ID:** Deterministic device fingerprinting ensuring the participant code never changes on the same smartphone.
4. **Text-First & Zero Data Drain:** Stripped heavy map tile and canvas chart rendering to save cellular data (0 MB consumed on maps), prevent CPU thermal throttling, and ensure 100% precision.
5. **Zero Horizontal Overflow:** Mobile-first layout (max 480px) tailored for standard mobile viewports (320px–430px) without horizontal scrolling.
6. **Screen Keep-Awake:** Screen Wake Lock API prevents the phone display from sleeping during active field trips.

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
1. เปิดหน้าเว็บ Dashboard บน Safari
2. กดปุ่ม **"🍎 โหลด iOS Shortcut"** บนแถบตรวจจับอุปกรณ์
3. แตะ **"เพิ่มคำสั่งลัด" (Add Shortcut)** ในแอปคำสั่งลัด
4. ตั้งค่าสิทธิ์: `Settings` > `Privacy & Security` > `Location Services` > `Shortcuts` > เลือก **"While Using the App"**

#### สำหรับ Android
1. เปิดหน้าเว็บ Dashboard บน Chrome
2. กดปุ่ม **"🤖 โหลด Android APK"** บนแถบตรวจจับอุปกรณ์
3. ติดตั้งไฟล์ APK ลงเครื่อง และเปิดสิทธิ์ Location / Nearby Devices

---

### 2. วิธีเริ่มเก็บข้อมูลการเดินทาง (Trip Session)

1. เปิดหน้าเว็บ Dashboard บนเบราว์เซอร์
2. ตรวจสอบรหัสผู้เข้าร่วม (ระบบผูกรหัสฮาร์ดแวร์ประจำเครื่องถาวร หรือพิมพ์รหัสนักศึกษาของตนเองได้)
3. เลือกโหมดการเดินทาง (**🚶 เดิน / 🚲 จักรยาน / 🛵 มอเตอร์ไซค์ / 🚗 รถยนต์**)
4. กดปุ่มใหญ่ **"▶ เริ่มบันทึก (START TRIP)"** (หน้าจอจะล็อกไม่ให้ดับอัตโนมัติ)
5. เริ่มตัวส่งสัญญาณ Wi-Fi:
   * **iOS:** สลับไปแอปคำสั่งลัดแล้วกดรัน **"Send Rssi Logger web"**
   * **Android:** เปิดแอป Companion แล้วกดปุ่ม **"START"**
6. ข้อมูล GPS + Wi-Fi RSSI จะแสดงผลสดบนหน้าจอแบบตัวเลขความคมชัดสูง
7. เมื่อเสร็จสิ้น กด **"⏹ หยุดบันทึก (STOP TRIP)"** 
   - ระบบจะส่งข้อมูลขึ้น **Google Drive ให้อัตโนมัติทันที** พร้อมขึ้นแถบแจ้งเตือนสีเขียว `✅ บันทึกเข้า Google Drive สำเร็จแล้ว (X จุด)`
   - สามารถกดปุ่ม **"📥 โหลดไฟล์ CSV"** เพื่อบันทึกสำรองในเครื่องได้ตลอดเวลา

---

### โครงสร้างไฟล์ในโปรเจกต์

```text
RSSI Web Logger/
├── plan.md                              # แผนงานและสถาปัตยกรรมระบบ
├── README.md                            # คู่มือการติดตั้งและใช้งาน (TH/EN)
├── NEXT_STEPS.md                        # สรุปขั้นตอนการทดสอบและ Deploy
├── package.json                         # Node.js dependencies & scripts
├── server.js                            # Local Express API Server + SSE + Google Drive proxy
├── vercel.json                          # คอนฟิก Serverless Functions บน Vercel
├── Send Rssi Logger web.shortcut        # ไฟล์ Shortcut สำหรับ iOS
├── api/                                 # Serverless endpoints สำหรับ Vercel
│   ├── log.js                           # รับข้อมูลสัญญาณ Wi-Fi & GPS + ส่งต่อไป Google Drive
│   ├── sync-drive.js                    # ส่งข้อมูลแบบ Batch ขึ้น Google Drive / Google Sheets
│   ├── logs.js                          # ดึงประวัติข้อมูล telemetry
│   └── export.js                        # ส่งออกข้อมูล CSV
├── public/                              # หน้าเว็บ Mobile-First Dashboard
│   ├── index.html                       # หน้าเว็บแบบ Text-First Telemetry
│   ├── style.css                        # ธีม Mobile-First Zero-Overflow
│   ├── app.js                           # ลอจิก Hardware ID, GPS, Auto-Sync Google Drive
│   └── downloads/                       # ไฟล์ Bridge สำหรับผู้ใช้ดาวน์โหลด
│       ├── Send Rssi Logger web.shortcut
│       ├── rssi-logger-android.apk
│       └── macrodroid_guide.txt
└── scripts/
    ├── google_drive_script.js           # โค้ด Google Apps Script สำหรับวางใน Google Drive
    └── test_ping.py                     # สคริปต์จำลองยิงข้อมูลทดสอบ
```

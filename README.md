# RSSI Web Logger: Dual-OS Wi-Fi & GPS Telemetry System

A modern, cross-platform Web Application + Mobile Bridge pipeline for collecting synchronized Wi-Fi RSSI (dBm), MAC/BSSID, SSID, and High-Precision GPS metrics directly on **iOS (iOS 17+)** and **Android**, with automated deployment on **Vercel** and live cloud synchronization to **Google Drive & Google Sheets**.

[ภาษาไทย (Thai Guide) คลิกที่นี่](#คู่มือการใช้งานภาษาไทย)

---

## Architecture Overview

1. **Vercel Cloud Deployment (`/api/*`):** Serverless architecture hosting the Web Dashboard and receiving telemetry streams (`/api/log`, `/api/sync-drive`, `/api/export`).
2. **Google Drive & Google Sheets Sync:** Turnkey synchronization via Google Apps Script (`scripts/google_drive_script.js`), creating instant spreadsheet records and archiving trip CSV files in Google Drive.
3. **Screen Keep-Awake:** Screen Wake Lock API prevents the phone display from sleeping during active field trips.
4. **Web Dashboard (`public/`):** Leaflet dark-themed GPS mapping, real-time Chart.js signal telemetry, signal meter gauge, and auto-OS detection banner.
5. **Mobile Telemetry Bridges:**
   * **iOS:** Apple Shortcuts (`Send Rssi Logger web.shortcut`) reading native `Get Network Details` (zero-app install).
   * **Android:** 1-Click Companion APK (`rssi-logger-android.apk`) reading `WifiManager` metrics directly (minimum user friction).

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
3. (Optional) Set `GOOGLE_DRIVE_WEBHOOK_URL` in Vercel Environment Variables.
4. Click **Deploy** to obtain your live HTTPS URL (e.g. `https://rssi-web-logger.vercel.app`).

---

## การเชื่อมต่อ Google Drive & Google Sheets (2 นาที)

1. ไปที่ **[script.google.com](https://script.google.com)** แล้วคลิก **"โครงการใหม่" (New project)**
2. คัดลอกโค้ดทั้งหมดในไฟล์ [`scripts/google_drive_script.js`](scripts/google_drive_script.js) ไปวางแทนที่
3. กดปุ่ม **"การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New deployment)**
4. เลือกประเภทเป็น **เว็บแอป (Web app)**:
   * **ดำเนินการในฐานะ (Execute as):** ฉัน (Me)
   * **ผู้มีสิทธิ์เข้าถึง (Who has access):** ทุกคน (Anyone)  *(สำคัญมาก)*
5. กด **ทำให้ใช้งานได้ (Deploy)** แล้วคัดลอก **URL เว็บแอป** (ขึ้นต้นด้วย `https://script.google.com/macros/s/...`)
6. นำ URL มาวางในช่อง **"Google Apps Script Webhook URL"** บนหน้าเว็บ Dashboard

> **ผลลัพธ์:** ข้อมูลจะถูกบันทึกลง Google Sheet ชื่อ `RSSI_Web_Logger_Master` และสร้างไฟล์ CSV แยกรายทริปเก็บไว้ในโฟลเดอร์ `RSSI_Web_Logger_Trips` บน Google Drive ของคุณโดยอัตโนมัติ

---

## คู่มือการใช้งานภาษาไทย

### 1. วิธีติดตั้งฝั่งมือถือ (ทำครั้งเดียว)

#### สำหรับ iPhone / iPad (iOS 17+)
1. เปิดหน้าเว็บ Dashboard บน Safari
2. กดปุ่ม **"🍎 ดาวน์โหลด iOS Shortcut"** บนแถบตรวจจับอุปกรณ์
3. แตะ **"เพิ่มคำสั่งลัด" (Add Shortcut)** ในแอปคำสั่งลัด
4. ตั้งค่าสิทธิ์: `Settings` > `Privacy & Security` > `Location Services` > `Shortcuts` > เลือก **"While Using the App"**

#### สำหรับ Android
1. เปิดหน้าเว็บ Dashboard บน Chrome
2. กดปุ่ม **"🤖 ดาวน์โหลด Android APK"** บนแถบตรวจจับอุปกรณ์
3. แตะเปิดไฟล์เพื่อติดตั้ง (Install APK)
4. เปิดแอป Companion อนุญาตสิทธิ์ Location/Nearby Devices

---

### 2. วิธีเริ่มเก็บข้อมูลการเดินทาง (Trip Session)

1. เปิดหน้าเว็บ Dashboard บนเบราว์เซอร์
2. เลือกโหมดการเดินทาง (**🚶 เดิน / 🚲 จักรยาน / 🛵 มอเตอร์ไซค์ / 🚗 รถยนต์**)
3. กดปุ่ม **"START TRIP"** บนหน้าเว็บ (ระบบจะเปิดโหมด Screen Awake ป้องกันจอดับอัตโนมัติ)
4. เริ่มตัวส่งสัญญาณ Wi-Fi:
   * **iOS:** สลับไปแอปคำสั่งลัดแล้วกดรัน **"Send Rssi Logger web"**
   * **Android:** เปิดแอป Companion แล้วกดปุ่ม **"START"**
5. ข้อมูล GPS + Wi-Fi RSSI จะแสดงผลสดบนหน้าจอ และซิงค์ขึ้น **Google Drive** อัตโนมัติ
6. เมื่อเสร็จสิ้น กด **"STOP TRIP"** ข้อมูลจะถูกจัดเก็บเข้า Google Drive ทันที

---

### โครงสร้างไฟล์ในโปรเจกต์

```text
RSSI Web Logger/
├── plan.md                              # แผนงานและสถาปัตยกรรมระบบ Dual-OS + Google Drive
├── README.md                            # คู่มือการติดตั้งและใช้งาน (TH/EN)
├── package.json                         # Node.js dependencies & scripts
├── server.js                            # Local Express API Server + SSE + Google Drive proxy
├── vercel.json                          # คอนฟิก Serverless Functions บน Vercel
├── Send Rssi Logger web.shortcut        # ไฟล์ Shortcut สำหรับ iOS
├── api/                                 # Serverless endpoints สำหรับ Vercel
│   ├── log.js                           # รับข้อมูลสัญญาณ Wi-Fi & GPS + ส่งต่อไป Google Drive
│   ├── sync-drive.js                    # ส่งข้อมูลแบบ Batch ขึ้น Google Drive / Google Sheets
│   ├── logs.js                          # ดึงประวัติข้อมูล telemetry
│   └── export.js                        # ส่งออกข้อมูล CSV
├── public/                              # หน้าเว็บ Dashboard
│   ├── index.html                       # หน้าเว็บพร้อมแผง Google Drive Sync & WakeLock
│   ├── style.css                        # ธีม Dark Cyberpunk & Glassmorphism
│   ├── app.js                           # ลอจิกแผนที่, กราฟ, GPS, WakeLock, และ Google Drive Sync
│   └── downloads/                       # ไฟล์ Bridge สำหรับผู้ใช้ดาวน์โหลด
│       ├── Send Rssi Logger web.shortcut
│       ├── rssi-logger-android.apk
│       └── macrodroid_guide.txt
└── scripts/
    ├── google_drive_script.js           # โค้ด Google Apps Script สำหรับวางใน Google Drive
    └── test_ping.py                     # สคริปต์จำลองยิงข้อมูลทดสอบ
```

# RSSI Web Logger: Dual-OS Wi-Fi & GPS Telemetry System

A modern, cross-platform Web Application + Mobile Bridge pipeline for collecting synchronized Wi-Fi RSSI (dBm), MAC/BSSID, SSID, and High-Precision GPS metrics directly on **iOS (iOS 17+)** and **Android**, with automated deployment on **Vercel** and synchronization to **Google Database** (Google Sheets / Firestore).

[ภาษาไทย (Thai Guide) คลิกที่นี่](#คู่มือการใช้งานภาษาไทย)

---

## Architecture Overview

1. **Vercel Cloud Deployment (`/api/*`):** Serverless architecture hosting the Web Dashboard and receiving telemetry streams.
2. **Google Database Integration:** Centralized data persistence via Google Sheets API or Firebase Firestore.
3. **Web Dashboard (`public/`):** Leaflet dark-themed GPS mapping, real-time Chart.js signal telemetry, signal meter gauge, and auto-OS detection banner.
4. **Mobile Telemetry Bridges:**
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

1. Push this project to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Click **Deploy** to obtain your live HTTPS URL (e.g. `https://rssi-web-logger.vercel.app`).
4. Configure Google Service Account credentials in Vercel Environment Variables (`GOOGLE_SERVICE_ACCOUNT_KEY`, `SPREADSHEET_ID`).

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
3. กดปุ่ม **"START TRIP"** บนหน้าเว็บเพื่อเริ่มบันทึกพิกัด GPS
4. เริ่มตัวส่งสัญญาณ Wi-Fi:
   * **iOS:** สลับไปแอปคำสั่งลัดแล้วกดรัน **"Send Rssi Logger web"**
   * **Android:** เปิดแอป Companion แล้วกดปุ่ม **"START"**
5. ข้อมูล GPS + Wi-Fi RSSI จะถูกผสานกันและส่งขึ้น **Google Database** อัตโนมัติแบบ Real-time
6. เมื่อเสร็จสิ้น กด **"STOP TRIP"** (สามารถกด **"EXPORT CSV"** เพื่อสำรองไฟล์ได้)

---

### โครงสร้างไฟล์ในโปรเจกต์

```text
RSSI Web Logger/
├── plan.md                              # แผนงานและสถาปัตยกรรมระบบ Dual-OS + Google DB
├── README.md                            # คู่มือการติดตั้งและใช้งาน (TH/EN)
├── package.json                         # Node.js dependencies & scripts
├── server.js                            # Local Express API Server + SSE live streaming
├── vercel.json                          # คอนฟิก Serverless Functions บน Vercel
├── Send Rssi Logger web.shortcut        # ไฟล์ Shortcut สำหรับ iOS
├── api/                                 # Serverless endpoints สำหรับ Vercel
│   ├── log.js                           # รับข้อมูลสัญญาณ Wi-Fi & GPS
│   ├── logs.js                          # ดึงประวัติข้อมูล telemetry
│   └── export.js                        # ส่งออกข้อมูล CSV
├── public/                              # หน้าเว็บ Dashboard
│   ├── index.html                       # โครงสร้างหน้าเว็บพร้อมแถบตรวจจับ OS
│   ├── style.css                        # ธีม Dark Cyberpunk & Glassmorphism
│   ├── app.js                           # ลอจิกแผนที่, กราฟ, GPS, และการบันทึก
│   └── downloads/                       # ไฟล์ Bridge สำหรับผู้ใช้ดาวน์โหลด
│       ├── Send Rssi Logger web.shortcut
│       ├── rssi-logger-android.apk
│       └── macrodroid_guide.txt
└── scripts/
    └── test_ping.py                     # สคริปต์จำลองยิงข้อมูลทดสอบ
```

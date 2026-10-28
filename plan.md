# แผนงานระบบ RSSI Web Logger (รองรับทั้ง iOS & Android + Google Drive)

## 1. บทนำและสถาปัตยกรรมรวม (Dual-OS Architecture)
ระบบถูกออกแบบให้ **หน้าเว็บ Dashboard เดียวกันรองรับผู้ใช้ทั้ง iOS และ Android** โดยมีเป้าหมายคือลดขั้นตอนของผู้ใช้ (Frictionless / Minimum Steps) ให้ได้มากที่สุด:
* **Hosting & Backend:** Deploy บน **Vercel** (Serverless API Functions: `/api/log`, `/api/logs`, `/api/export`, `/api/sync-drive`)
* **ฐานข้อมูลคลาวด์ (Google Drive & Sheets):** บันทึกตรงเข้า **Google Drive** ผ่าน Google Apps Script Webhook (อัปเดต Google Sheets แบบ Real-time และสำรองไฟล์ CSV เข้าโฟลเดอร์ Google Drive ทุกทริป)
* **หน้าจอเปิดค้างอัตโนมัติ (Screen Wake Lock):** ป้องกันหน้าจอดับขณะเดินทางเก็บข้อมูลบนทั้ง iOS Safari และ Android Chrome
* **พิกัด GPS:** ดึงสดผ่านเว็บเบราว์เซอร์ (`navigator.geolocation`) ทั้งบน iOS (Safari) และ Android (Chrome)
* **สัญญาณ Wi-Fi (BSSID, SSID, RSSI dBm):** เบราว์เซอร์ถูกบล็อกไม่ให้เข้าถึงฮาร์ดแวร์ Wi-Fi ตามมาตรฐานความปลอดภัย (W3C) จึงใช้ตัวช่วยส่งสัญญาณระดับเบื้องหลังที่มีขั้นตอนติดตั้งสั้นที่สุด:
  * **iOS (iPhone/iPad):** ใช้แอปที่ติดมากับเครื่อง **Apple Shortcuts** (`Send Rssi Logger web.shortcut`) โหลด 1 คลิก ไม่ต้องติดตั้งแอปเพิ่ม
  * **Android:** ใช้ **Single-Click Companion APK** (`rssi-logger-android.apk`) ดาวน์โหลดติดตั้งปุ่มเดียว กด START ส่งค่าเข้าเว็บ/Google DB ทันที

---

## 2. ตารางสถานะความคืบหน้า (Progress Tracker)

| ลำดับ | รายการงาน (Task) | แพลตฟอร์ม | สถานะ (Status) |
| :---: | :--- | :---: | :---: |
| 1 | สร้างโครงสร้างโปรเจกต์ `RSSI Web Logger` บน Desktop | ทั้งหมด | ✅ เสร็จสิ้น |
| 2 | พัฒนา Backend Server (`server.js`, SSE, REST API, CSV Export) | ทั้งหมด | ✅ เสร็จสิ้น |
| 3 | พัฒนา Web Dashboard (Map CartoDB, Chart.js, Gauge, Mode Switcher) | ทั้งหมด | ✅ เสร็จสิ้น |
| 4 | แปลง Apple Shortcut ต้นแบบเป็น `Send Rssi Logger web.shortcut` | iOS | ✅ เสร็จสิ้น |
| 5 | ระบบดึงชื่อเครื่อง (Device Name) เป็น `participant_id` อัตโนมัติ | iOS & Web | ✅ เสร็จสิ้น |
| 6 | เพิ่มระบบตรวจสอบระบบปฏิบัติการ (Auto OS Detection) บนหน้าเว็บ | iOS & Android | ✅ เสร็จสิ้น |
| 7 | เตรียมชุดไฟล์ Bridge สำหรับ Android (`public/downloads/`) | Android | ✅ เสร็จสิ้น |
| 8 | ปุ่มดาวน์โหลด Bridge แบบ 1-Tap ไฮไลต์ตามอุปกรณ์บน Dashboard | ทั้งหมด | ✅ เสร็จสิ้น |
| 9 | เชื่อมต่อระบบบันทึกข้อมูลเข้า Google Drive & Google Sheets | Vercel & Cloud | ✅ เสร็จสิ้น |
| 10 | เพิ่มระบบ Screen Wake Lock ป้องกันจอดับขณะบันทึกข้อมูล | iOS & Android | ✅ เสร็จสิ้น |
| 11 | การทดสอบ Local/E2E และ Deploy พร้อมใช้งานบน GitHub/Vercel | ทั้งหมด | ✅ เสร็จสิ้น |

---

## 3. Data Schema ร่วมกัน (ทั้ง iOS & Android)
ทุกข้อมูลจากทั้งสองระบบจะถูกแปลงเป็นรูปแบบเดียวกันในฐานข้อมูล Google Drive และไฟล์ CSV:
`timestamp, participant_id, trip_id, latitude, longitude, accuracy, speed, ssid, bssid, rssi, user_label_mode`

---

## 4. สรุปขั้นตอนของผู้ใช้งาน (User Workflow - Minimum Steps)
* **ฝั่ง iOS:**
  1. เปิดหน้าเว็บ Dashboard บน Safari
  2. กดปุ่มดาวน์โหลด iOS Shortcut > กดยอมรับเพิ่มในแอปคำสั่งลัด (ทำครั้งเดียว)
  3. กด START TRIP บนเว็บ > รัน Shortcut ในพื้นหลัง
  4. เมื่อจบการเดินทาง กด STOP TRIP ข้อมูลจะ Sync เข้า Google Drive อัตโนมัติ
* **ฝั่ง Android:**
  1. เปิดหน้าเว็บ Dashboard บน Chrome
  2. กดปุ่มดาวน์โหลด Android APK > กดติดตั้ง (ทำครั้งเดียว)
  3. กด START TRIP บนเว็บ > กด START ในแอป Companion
  4. เมื่อจบการเดินทาง กด STOP TRIP ข้อมูลจะ Sync เข้า Google Drive อัตโนมัติ

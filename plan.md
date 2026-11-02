# แผนงานระบบ RSSI Web Logger (Mobile-First & Cloud Ready)

## 1. บทนำและสถาปัตยกรรมรวม (Dual-OS Architecture)
ระบบถูกออกแบบให้ **หน้าเว็บ Dashboard เดียวกันรองรับผู้ใช้ทั้ง iOS และ Android** โดยมีเป้าหมายคือลดขั้นตอนของผู้ใช้ (Frictionless / Minimum Steps) ให้ได้มากที่สุด พร้อมทั้งประหยัดอินเทอร์เน็ตและพลังงานมือถือสูงสุด (Zero Data Drain):
* **Hosting & Backend:** Deploy บน **Vercel** (Serverless API Functions: `/api/log`, `/api/logs`, `/api/export`, `/api/sync-drive`)
* **ฐานข้อมูลคลาวด์ (Google Drive & Sheets):** บันทึกตรงเข้า **Google Drive** อัตโนมัติเมื่อกด STOP TRIP พร้อมแสดงแถบสถานะแจ้งเตือนสด (Live Toast)
* **รหัสผู้เข้าร่วมถาวร (Hardware-Tied Device ID):** คำนวณจากสเปกฮาร์ดแวร์ประจำเครื่อง รหัสจะไม่เปลี่ยนเองตลอดไป พร้อมบันทึก 3 ชั้น (`localStorage` + `Cookie 10 ปี` + `Hardware Hash Fallback`)
* **ประหยัดเน็ต 100% (Zero Data Drain):** ถอดแผนที่และกราฟแคนวาสออกทั้งหมด แสดงผลแบบ Text-First Telemetry ทำให้หน้าเว็บเบา โหลดไว ไม่แย่งแบนด์วิดท์กับการยิงพิกัด GPS/Wi-Fi
* **หน้าจอเปิดค้างอัตโนมัติ (Screen Wake Lock):** ป้องกันหน้าจอดับขณะเดินทางเก็บข้อมูลบนทั้ง iOS Safari และ Android Chrome
* **ไม่ล้นแนวนอน (Zero Horizontal Overflow):** ออกแบบเลย์เอาต์ขนาดกะทัดรัด (Max 480px) พอดีหน้าจอมือถือทุกรุ่นตั้งแต่ 320px ขึ้นไป

---

## 2. ตารางสถานะความคืบหน้า (Progress Tracker)

| ลำดับ | รายการงาน (Task) | แพลตฟอร์ม | สถานะ (Status) |
| :---: | :--- | :---: | :---: |
| 1 | สร้างโครงสร้างโปรเจกต์ `RSSI Web Logger` บน Desktop | ทั้งหมด | ✅ เสร็จสิ้น |
| 2 | พัฒนา Backend Server (`server.js`, SSE, REST API, CSV Export) | ทั้งหมด | ✅ เสร็จสิ้น |
| 3 | พัฒนา Web Dashboard (Mode Switcher, Telemetry, Controls) | ทั้งหมด | ✅ เสร็จสิ้น |
| 4 | แปลง Apple Shortcut ต้นแบบเป็น `Send Rssi Logger web.shortcut` | iOS | ✅ เสร็จสิ้น |
| 5 | ปรับปรุงรหัสผู้เข้าร่วมเป็น Hardware-Tied Device ID ไม่เปลี่ยนเองตลอดกาล | ทั้งหมด | ✅ เสร็จสิ้น |
| 6 | เพิ่มระบบตรวจสอบระบบปฏิบัติการ (Auto OS Detection) บนหน้าเว็บ | iOS & Android | ✅ เสร็จสิ้น |
| 7 | เตรียมชุดไฟล์ Bridge สำหรับ Android (`public/downloads/`) | Android | ✅ เสร็จสิ้น |
| 8 | ปุ่มดาวน์โหลด Bridge แบบ 1-Tap ไฮไลต์ตามอุปกรณ์บน Dashboard | ทั้งหมด | ✅ เสร็จสิ้น |
| 9 | เชื่อมต่อระบบบันทึกข้อมูลเข้า Google Drive & Google Sheets อัตโนมัติ | Vercel & Cloud | ✅ เสร็จสิ้น |
| 10 | เพิ่มระบบ Screen Wake Lock ป้องกันจอดับขณะบันทึกข้อมูล | iOS & Android | ✅ เสร็จสิ้น |
| 11 | ปรับปรุง UX/UI เป็น Mobile-First & Text-First Telemetry (ตัด Map เพื่อประหยัดเน็ต 0 MB) | ทั้งหมด | ✅ เสร็จสิ้น |
| 12 | แก้ไขเลย์เอาต์หน้าจอไม่ให้ล้นแนวนอน (Zero Horizontal Overflow) 100% | ทั้งหมด | ✅ เสร็จสิ้น |
| 13 | เพิ่มแถบแจ้งเตือนสถานะการอัปโหลดเข้า Google Drive แบบ Real-Time ทันทีที่กดหยุด | ทั้งหมด | ✅ เสร็จสิ้น |

---

## 3. Data Schema ร่วมกัน (ทั้ง iOS & Android)
ทุกข้อมูลจากทั้งสองระบบจะถูกแปลงเป็นรูปแบบเดียวกันในฐานข้อมูล Google Drive และไฟล์ CSV:
`timestamp, participant_id, trip_id, latitude, longitude, accuracy, speed, ssid, bssid, rssi, user_label_mode`

---

## 4. สรุปขั้นตอนของผู้ใช้งาน (User Workflow - Ready to Use)
* **การติดตั้ง (ทำครั้งเดียว):**
  - **iOS:** โหลดคำสั่งลัดจากหน้าเว็บ > กดเพิ่มใน Shortcuts > อนุญาตสิทธิ์ Location "While Using"
  - **Android:** โหลดและติดตั้ง Companion APK จากหน้าเว็บ > อนุญาตสิทธิ์ Location
* **การบันทึกข้อมูล:**
  1. เปิดหน้าเว็บ > ตรวจสอบรหัสเครื่อง (มีให้ถาวร) > เลือกโหมดเดินทาง
  2. กดปุ่มใหญ่ **"▶ เริ่มบันทึก (START TRIP)"** (หน้าจอจะล็อกไม่ให้ดับอัตโนมัติ)
  3. สลับไปเปิดคำสั่งลัด / แอป Companion เพื่อส่งค่า Wi-Fi
  4. เมื่อถึงปลายทาง กดปุ่ม **"⏹ หยุดบันทึก (STOP TRIP)"**
  5. ระบบจะขึ้นแถบเขียว `✅ บันทึกเข้า Google Drive สำเร็จแล้ว (X จุด)` ให้อัตโนมัติ

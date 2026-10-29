# คู่มือขั้นตอนการดำเนินงานถัดไป (Next Steps & Deployment Guide)

เอกสารสรุปขั้นตอนการนำระบบ **RSSI Web Logger** ขึ้นใช้งานจริงและการทดสอบเก็บข้อมูลภาคสนาม

---

### ขั้นตอนที่ 1: Deploy ขึ้น Vercel (ใช้เวลา ~1 นาที)
เพื่อให้ได้ URL สาธารณะแบบ HTTPS สำหรับเปิดใช้งานผ่านเบราว์เซอร์บนมือถือได้ทุกที่:

1. เข้าสู่ระบบที่ **[vercel.com/new](https://vercel.com/new)**
2. ล็อกอินด้วยบัญชี GitHub แล้วเลือก Import Repository:
   * **Target Repo:** `Kitsada4435/rssi-web-logger`
3. ตั้งค่าการ Deploy:
   * **Framework Preset:** Other
   * **Root Directory:** `./`
   * *(ทางเลือก)* Environment Variables: หากต้องการเปลี่ยน Webhook ให้ใส่ `GOOGLE_DRIVE_WEBHOOK_URL` (หากไม่ใส่ ระบบจะใช้ค่าเริ่มต้นของโปรเจกต์เดิมอัตโนมัติ)
4. กดปุ่ม **Deploy**
5. เมื่อเสร็จสิ้น จะได้โดเมนจริงทันที (เช่น `https://rssi-web-logger.vercel.app`)

---

### ขั้นตอนที่ 2: ทดสอบเก็บข้อมูลภาคสนาม (Field Test)

#### สำหรับผู้ใช้ iOS (iPhone/iPad):
1. เปิด Safari ไปที่ URL ของ Vercel ที่ได้จากขั้นตอนที่ 1
2. กดปุ่ม **"🍎 ดาวน์โหลด iOS Shortcut"** บนแถบแจ้งเตือนด้านบน
3. แตะ **"เพิ่มคำสั่งลัด" (Add Shortcut)** ในแอปคำสั่งลัด
4. ตรวจสอบสิทธิ์: `การตั้งค่า` > `ความเป็นส่วนตัวและความปลอดภัย` > `บริการหาตำแหน่งที่ตั้ง` > `คำสั่งลัด` > เลือก **"ในระหว่างใช้แอป"**
5. กลับมาที่หน้าเว็บ เลือกโหมดเดินทาง (เดิน/จักรยาน/มอเตอร์ไซค์/รถยนต์) > กด **"START TRIP"**
6. สลับไปรันคำสั่งลัด **"Send Rssi Logger web"** แล้วเดิน/ขับขี่ทดสอบ 1-2 นาที
7. เมื่อเสร็จสิ้น กลับมากด **"STOP TRIP"** บนหน้าเว็บ

#### สำหรับผู้ใช้ Android:
1. เปิด Chrome ไปที่ URL ของ Vercel
2. กดปุ่ม **"🤖 ดาวน์โหลด Android APK"** บนแถบด้านบน
3. ติดตั้งไฟล์ APK ลงเครื่อง และเปิดสิทธิ์ Location / Nearby Devices
4. บนหน้าเว็บ กด **"START TRIP"**
5. เปิดแอป Companion กด **"START"** แล้วเดิน/ขับขี่ทดสอบ 1-2 นาที
6. เมื่อเสร็จสิ้น กด **"STOP TRIP"** บนหน้าเว็บ

---

### ขั้นตอนที่ 3: ตรวจสอบข้อมูลใน Google Drive

เมื่อกด **STOP TRIP** ระบบจะส่งข้อมูลขึ้น Google Drive ให้ทันทีแบบอัตโนมัติ:

* **Google Account:** `kritsada.kawongsa@gmail.com`
* **Google Drive Folder ID:** `1DtbWXEuofNvZINSBrmXzn5CnXdzPzjFQ`
* **ตำแหน่งไฟล์ที่จัดเก็บ:**  
  `dataset / {Platform} / {DeviceModel} / {ParticipantID} / <ชื่อไฟล์>.csv`
* ตรวจสอบว่ามีไฟล์ CSV ของรอบการบันทึกล่าสุดอัปโหลดเข้าไปในโฟลเดอร์เรียบร้อยแล้ว

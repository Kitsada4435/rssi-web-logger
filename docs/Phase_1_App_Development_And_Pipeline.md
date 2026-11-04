# แผนการพัฒนาแอปพลิเคชัน (App Development Plan)
โครงการ: การจำแนกรูปแบบการเดินทางจากการเปลี่ยนแปลงของ RSSI (Wi-Fi) บน iOS และ Android

เอกสารนี้คือแผนการพัฒนาแอปพลิเคชันเก็บข้อมูล (Data Logger) ด้วย Flutter โดยเน้นที่เฟส 1 (พิสูจน์ความเป็นไปได้และวางท่อข้อมูล) ตามเอกสารสรุปโครงการ

**อัปเดตล่าสุด (Last Updated):** 14 ตุลาคม 2026 (สรุปแนวทางการแจกจ่ายแอปผ่าน GitHub + Sideloadly สำหรับกลุ่มนักศึกษาวิศวกรรมคอมพิวเตอร์ และอัปเดตสถานะ Data Pipeline)

---

## 1. การตั้งค่าโครงการ (Project Setup & Infrastructure)
- [x] สร้างโปรเจกต์ Flutter ใหม่ (ชื่อ `rssi_logger`)
  - `android/` : สำหรับเขียนโค้ด Native (Kotlin) สแกน Wi-Fi และทำ Foreground Service
  - `ios/` : สำหรับเขียนโค้ด Native (Swift) ทำ App Intent รับค่าจาก Shortcuts
  - `lib/` : สำหรับเขียนโค้ด Flutter (Dart) ทำหน้า UI และฐานข้อมูล ใช้ร่วมกันทั้ง 2 ระบบ)
    - ได้มีการทำ Refactoring โครงสร้าง (แยก `SensorManager` เป็น `GpsProvider`, `WifiProvider`, `ImuProvider`, `ActivityProvider`) เพื่อให้ตรงตามหลัก OOP (SOLID) และง่ายต่อการปรับแก้ในอนาคต
- [x] ติดตั้งแพ็กเกจที่จำเป็น:
  - `drift` & `sqlite3_flutter_libs` (ฐานข้อมูล Local)
  - `http` ร่วมกับ Google Apps Script (GAS) Web App (สำหรับอัปโหลดไฟล์ `.zip` ขึ้น Google Drive โดยไม่ต้องผูกบัตรเครดิต)
  - `archive` (สำหรับบีบอัดไฟล์ zip)
  - `geolocator` (GPS)
  - `sensors_plus` (IMU)
  - `permission_handler` (จัดการสิทธิ์)
  - `path_provider` & `csv` (จัดการไฟล์)
  - `flutter_background_service` หรือเทียบเท่า (สำหรับการทำงานเบื้องหลัง)
- [x] ออกแบบและสร้าง Schema ฐานข้อมูลด้วย `drift` (สร้างไฟล์ `lib/database.dart` และ `database.g.dart` แล้ว)

## 2. โมดูลการขอสิทธิ์ (Permissions)
- [x] **Android:** ขอสิทธิ์ Location, `NEARBY_WIFI_DEVICES`, `ACTIVITY_RECOGNITION`, Foreground Service (อัปเดตลง `AndroidManifest.xml` แล้ว)
- [x] **iOS:** ขอสิทธิ์ Location (Always), Motion, ตั้งค่า Background Mode (`location`, `fetch`, `processing`) และ URL Scheme ใน `Info.plist`

## 3. การพัฒนาระบบเก็บข้อมูล (Data Collection Modules)
- [x] **โมดูล Metadata (Machine Learning):** สร้างระบบดึง `device_model`, `os_version`, และสุ่ม `participant_id` ประจำเครื่องแบบถาวร (SharedPreferences)
- [x] **โมดูล GPS:** ดึงค่าตำแหน่ง, ความเร็ว, accuracy ทุกๆ 1 วินาที (เขียนลง `lib/sensor_manager.dart` แล้ว)
- [x] **โมดูล IMU:** ดึงค่า Accelerometer และ Gyroscope พร้อมตำแหน่งมือถือ (`phone_position`)
- [x] **โมดูล Wi-Fi (Android):** (สร้าง `EventChannel` ฝั่ง Kotlin ดึงค่าทุก 1 วินาทีสำเร็จ)
  - [x] เขียน Kotlin Platform Channel ใช้ `WifiManager.connectionInfo`
  - [x] สแกนข้อมูล BSSID และ RSSI (dBm) ของ AP ที่เชื่อมต่ออยู่
  - [x] จัดการ Edge Case ป้องกัน Data ขยะ (Clear stale data หาก Wi-Fi หลุดการเชื่อมต่อ)
- [x] **โมดูล Wi-Fi (iOS):**
  - [x] สร้าง Swift App Intent (`LogWifiSampleIntent`) เพื่อรับค่าจาก Shortcuts (iOS 16+)
  - [x] สร้าง Custom URL Scheme (`rssilogger://wifi`) เพื่อรับค่าจาก Siri Shortcuts ทุกเวอร์ชัน
  - [x] เชื่อม EventChannel และ NotificationCenter ใน `AppDelegate.swift` ส่งตรงเข้า Flutter `SensorManager`

## 4. อินเทอร์เฟซผู้ใช้และระบบควบคุม (UI & Control Logic)
- [x] หน้าหลัก (Home) แบบ Continuous Trip Dashboard (Vibrant High-Contrast):
  - [x] ปุ่ม Start / Stop การบันทึกข้อมูลแบบกันกดเบิ้ล (Lock state) พร้อมระบบ Auto-Export เป็น CSV ทันที
  - [x] ระบบแสดงข้อมูลการทดสอบ (Metadata): แสดง Participant ID และให้ผู้ใช้เลือกตำแหน่งการวางมือถือ (ซ่อนอัตโนมัติเมื่อกดบันทึกเพื่อเพิ่มพื้นที่แสดงผล)
  - [x] ระบบ Auto-labeling ด้วย Android Activity Recognition
  - [x] ปุ่ม Quick Tag (Walk, Bike, Motorcycle, Car) สำหรับเปลี่ยน Label กลางอากาศโดยไม่ต้องหยุดอัด
  - [x] Dashboard สู้แสง (Outdoor Visibility) แสดงข้อมูล Real-time (Wi-Fi, GPS, IMU) เป็นตัวเลขขนาดใหญ่ และไม่มีการ Scroll (หน้าเดียวจบ)
  - [x] ระบบตรวจสอบสิทธิ์ (Fail-safe Permission Check) เตือนบนจอและล็อคปุ่มบันทึกหากผู้ใช้ไม่ได้ให้สิทธิ์
- [x] หน้าประวัติและจัดการไฟล์ (History - Pro Dashboard):
  - [x] ดีไซน์ Modern UI แสดงรายการไฟล์ CSV ที่บันทึกสำเร็จ พร้อมฟอร์แมตชื่อไฟล์ให้อ่านง่าย (Human-readable Datetime)
  - [x] ระบบ Multi-Select เลือกหลายไฟล์พร้อมกัน พร้อมปุ่ม "Select All"
  - [x] Smart Action Bar ด้านล่าง สำหรับกด Sync All (อัปโหลดขึ้น Drive รวดเดียว) หรือ Batch Delete (ลบรวดเดียว)
- [x] หน้าคลาวด์ซิงค์/ตั้งค่า (Cloud Sync & Settings):
  - [x] ดึงข้อมูลจาก SQLite แปลงเป็น `.csv` (ใช้งานผ่าน `ExportManager` ได้แล้ว)
  - [x] ระบบ Manual Cleanup รักษาไฟล์ไว้ในเครื่องเสมอเพื่อป้องกัน Data Loss จะถูกลบก็ต่อเมื่อผู้ใช้กดลบด้วยตัวเอง
  - [x] หน้าแนะนำการตั้งค่า Battery / Permissions และคู่มือตั้งค่าเครื่องก่อนเก็บข้อมูลสำหรับผู้ใช้ (Device Setup Guide Modal)
  - [x] หน้าตั้งค่าระบบ (Settings Page): ปรับเปลี่ยน Web App URL พร้อมปุ่มทดสอบเชื่อมต่อ และปรับ Sampling Rate ได้อิสระ

## 5. การทำงานเบื้องหลัง และ Data Pipeline (Background & Data Pipeline)
- [x] **Android:** สร้าง Foreground Service พร้อม Notification ให้แอปทำงานได้ตลอดเวลาแม้ปิดจอ (เสร็จสมบูรณ์)
- [x] **iOS:** เปิดใช้งาน Background Modes (`location`, `fetch`, `processing`) ใน `Info.plist` (เสร็จสมบูรณ์)
- [x] **Data Pipeline (อัปโหลดขึ้น Google Drive ผ่าน GAS):** ดึงข้อมูลจาก SQLite -> แปลงเป็นไฟล์ CSV ทันทีเมื่อจบ Session (Auto-Export) -> บีบอัดเป็นไฟล์ `.zip` ในหน่วยความจำ (In-Memory ZIP ลดขนาดจาก ~30MB/ชม. เหลือ ~5MB/ชม.) -> อัปโหลดขึ้น Google Drive ผ่าน Google Apps Script (เปลี่ยนจาก Firebase เพื่อเลี่ยงข้อจำกัดการผูกบัตรเครดิต) พร้อมระบบ Manual Cleanup ที่เก็บไฟล์สำรองไว้ในเครื่องเสมอจนกว่าผู้ใช้จะกดลบเอง

## 6. การทดสอบในเฟส 1 (Testing & Validation)
- [x] **ทดสอบการสร้างไฟล์ติดตั้ง (Build & Analysis Test):** ตรวจสอบ Code Quality ผ่าน (ไม่พบ Error ร้ายแรง) บิลด์ `app-debug.apk` และ `app-release.apk` (59.9 MB) ได้สำเร็จสมบูรณ์ (แก้ไขปัญหา Java 17 และ `coreLibraryDesugaring` เรียบร้อย)
- [x] **ทดสอบความหน่วง (Time Sync):** ตรวจสอบว่า timestamp จาก GPS, IMU และ Wi-Fi ตรงกันหรือไม่ (เพิ่ม `tMonoNs` เพื่อให้ Sync กันระดับไมโครวินาทีแล้ว)
- [ ] **ทดสอบ Android:** ตรวจสอบความถี่ของการอัปเดต RSSI และปัญหาแอปถูกฆ่าจาก Battery Optimization บนยี่ห้อต่างๆ (เช่น Xiaomi, Samsung)
- [ ] **ทดสอบ iOS:** ตรวจสอบว่า Shortcuts ทำงานต่อเนื่องได้นานแค่ไหนเมื่อจอปิด (Repeat + Wait)
- [x] **Export Data:** ทดลองเก็บข้อมูลจริงสั้นๆ (Pilot test) และส่งออก CSV ออกมาตรวจสอบความสมบูรณ์ของฟิลด์ต่างๆ (แก้ไขบั๊ก `const CsvEncoder` และบั๊ก `async/await` แล้ว)

## 7. แผนการดำเนินการ (Execution Timeline)
- **Sprint 1: โครงสร้างและฐานข้อมูล (เสร็จสมบูรณ์)**
  - [x] สร้างโปรเจกต์ `flutter create` และติดตั้งแพ็กเกจ (ผ่านการลบ Git ปลอมใน Windows และเปิด Developer Mode)
  - [x] พัฒนาโครงสร้าง Local Database ด้วย `drift`
- **Sprint 2: เซ็นเซอร์หลักและ UI พื้นฐาน (เสร็จสมบูรณ์)**
  - [x] สร้างหน้า UI หลักและระบบปุ่มกดเลือก Mode
  - [x] เชื่อมต่อ GPS (`geolocator`) และ IMU (`sensors_plus`) ลงฐานข้อมูลผ่าน `SensorManager`
- **Sprint 3: Native Wi-Fi & Background (เสร็จสมบูรณ์)**
  - [x] **Android:** เขียน Kotlin ดึง RSSI และเชื่อม `EventChannel`
  - [x] **Android:** สร้าง Foreground Service (เสร็จสมบูรณ์)
  - [x] **iOS:** เขียน Swift (`LogWifiSampleIntent.swift` + `AppDelegate.swift`) รองรับรับค่า Wi-Fi จาก Shortcuts ผ่านทั้ง AppIntent และ URL Scheme (`rssilogger://wifi`)
- **Sprint 4: Data Pipeline & Cloud Sync (เสร็จสมบูรณ์)**
  - [x] พัฒนาระบบส่งออก SQLite -> CSV ให้รองรับ Metadata ML ครบถ้วนตามมาตรฐานงานวิจัย 100%
  - [x] เพิ่มระบบจัดการไฟล์ (History Page) เพื่อกดดู แชร์ หรือลบไฟล์ CSV ได้ทันที
  - [x] พัฒนาระบบ Auto-Export สร้างไฟล์ CSV ทันทีเมื่อผู้ใช้กดหยุดทริป
  - [x] พัฒนาระบบอัปโหลดขึ้น Google Drive อัตโนมัติ ผ่าน Google Apps Script (เปลี่ยนจาก Firebase เพื่อแก้ปัญหาถูกบังคับผูกบัตรเครดิต)
  - [x] ทำ Pilot Test การเก็บข้อมูลจริง 1 รอบ (จำลองผ่าน Emulator และยืนยัน Data Pipeline สำเร็จ)
- **Sprint 5: Production Readiness, Settings & iOS Cloud Pipeline (เสร็จสมบูรณ์ 14 ต.ค. 2026)**
  - [x] พัฒนาหน้าตั้งค่าระบบ (Settings Page): ปรับแต่ง Google Apps Script URL พร้อมปุ่มทดสอบเชื่อมต่อ (Ping Check) และปรับ Sampling Rate ได้จากหน้าแอปโดยตรง
  - [x] เพิ่มระบบ Bypass Battery Optimization: ขอสิทธิ์ `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` และ `POST_NOTIFICATIONS` พร้อม Modal แนะนำการตั้งค่าเครื่อง (Device Setup Guide)
  - [x] ออกแบบไอคอนแอปใหม่ (App Icon): คลื่น Wi-Fi ผสาน Location Pin สไตล์ Neon Blue และติดตั้งลง Android Mipmap ทุกขนาด
  - [x] สร้าง CI/CD Cloud Pipeline: พัฒนา GitHub Actions Workflow (`build_ios.yml`) คอมไพล์ไฟล์ `.ipa` บน macOS Runner ให้อัตโนมัติ
- **Sprint 6: การสร้าง Release และเริ่มแจกจ่ายแอป (เสร็จสมบูรณ์ 14 ต.ค. 2026)**
  - [x] บิลด์ไฟล์ติดตั้ง Android Release APK (`app-release.apk` ขนาด 59.9 MB)
  - [x] สร้าง Git Tag `v1.0.0` และเผยแพร่ **[GitHub Release v1.0.0](https://github.com/Kitsada4435/rssi_logger_app/releases/tag/v1.0.0)** อย่างเป็นทางการ
  - [x] อัปโหลดไฟล์ติดตั้ง `app-release.apk` แนบเป็น Release Asset ให้ดาวน์โหลดได้ทันที
  - [x] สั่งรัน GitHub Actions `build_ios.yml` บน macOS Runner เพื่อคอมไพล์ `Runner.ipa` อัตโนมัติเรียบร้อย
- **Sprint 7: ซิงโครไนซ์ข้อมูล 1 วินาที, แก้ไขช่องว่าง CSV และแยกคอลัมน์โหมดอิสระ (เสร็จสมบูรณ์ 20 ต.ค. 2026)**
  - [x] **Synchronized 1-Second Snapshot Engine:** ออกแบบระบบจับภาพสถานะเซ็นเซอร์พร้อมกัน (GPS + Wi-Fi RSSI + IMU) บันทึกลงฐานข้อมูลเป็น 1 แถวสมบูรณ์ (`sync_sample`) ทุกๆ 1 วินาที แก้ปัญหาเวลาอัปเดตไม่พร้อมกัน
  - [x] **Zero Blank Cells Forward-Fill:** เพิ่มตรรกะ Forward-Fill ใน `ExportManager` รับประกันไฟล์ CSV ไม่มีช่องว่าง พร้อมเข้าสู่กระบวนการ Train โมเดล ML ได้ 100%
  - [x] **UI Lockstep Synchronized Refresh:** ปรับจังหวะการรีเฟรชหน้า Dashboard ให้เต้นตามรอบ Snapshot 1 วินาทีอย่างพร้อมเพรียงกัน (ตัวเลข RSSI, Speed, Accuracy สอดคล้องกันแบบเรียลไทม์)
  - [x] **Dual-Column Mode Architecture:** แยกการจัดเก็บ 2 คอลัมน์ชัดเจนใน CSV
    - `user_label_mode`: โหมดที่ผู้ใช้เลือกเอง เป็น Ground Truth
    - `activity_recognition_mode`: โหมดที่ระบบเดาอัตโนมัติ (Google Activity Recognition API) สำหรับใช้เป็น Baseline
  - [x] **Unrestricted Mode Selection:** ปลดล็อคเงื่อนไขสถานะปุ่มเลือกโหมด ผู้ใช้สามารถเลือกโหมดล่วงหน้าก่อนกด Start, เปลี่ยนกลางคันระหว่างเดินทาง (Quick Tag), และเปลี่ยนหลังกด Stop ได้อย่างอิสระ ไม่มีการค้างโหมดเดิม
  - [x] **iOS Startup Crash Fix & UIScene Integration:** แก้ไขปัญหาแอปเด้งออกหน้าขาวบน iOS โดยย้าย Plugin Registration ออกจาก `didFinishLaunchingWithOptions` ไปยัง `didInitializeImplicitFlutterEngine` ตามมาตรฐาน UIScene Lifecycle และเชื่อมต่อ `SceneDelegate.swift` ดัก URL Context จาก Apple Shortcuts
  - [x] **iOS On-Device Sideloading Validation (Scarlet):** ยืนยันการติดตั้งไฟล์ `Runner.ipa` สำเร็จโดยตรงบนเครื่อง iPhone ผ่านแอป Scarlet (ไม่ต้องใช้คอมพิวเตอร์) อ้างอิงขั้นตอนจาก [วิดีโอคู่มือ YouTube Shorts](https://www.youtube.com/shorts/Q2H62epJGB8)
- **Sprint 8: Persistent Participant ID & ป้องกันข้อมูลสูญหายเมื่อใบรับรองหมดอายุ (เสร็จสมบูรณ์ 25 ต.ค. 2026)**
  - [x] **iOS Keychain Persistence:** ติดตั้ง `flutter_secure_storage` เพื่อผูกและบันทึก `participant_id` ลงใน Keychain ของ iOS ข้อมูลจะไม่ถูกลบแม้ผู้ใช้เผลอลบแอปทิ้ง (Uninstall) เมื่อติดตั้งแอปใหม่ ระบบจะอ่านรหัสเดิมจาก Keychain กลับมาใช้งานได้ทันที 100%
  - [x] **Android Hardware ID Persistence:** เชื่อมต่อ MethodChannel ฝั่ง Kotlin ดึงค่า `Settings.Secure.ANDROID_ID` เป็นรหัสประจำเครื่องเริ่มต้น รับประกันว่าไม่ว่าจะลบหรือติดตั้งใหม่กี่ครั้ง รหัสเครื่องจะตรงเดิมเสมอ
  - [x] **Editable USER ID Field:** ปลดล็อค TextField บนหน้า Dashboard ให้ผู้ใช้สามารถตรวจสอบและพิมพ์แก้ไขรหัสเดิมได้เอง เพื่อความยืดหยุ่นกรณีสลับเครื่อง หรือต้องการใช้รหัสนักศึกษา
  - [x] **iOS Certificate Revocation Safeguards:** วิเคราะห์ปัญหาใบรับรอง Scarlet ถูก Apple สั่งระงับ (Revoke) และกำหนดแนวทางแก้ไขแบบติดตั้งทับโดยไม่ลบแอป หรือเปลี่ยนมาใช้ Sideloadly ร่วมกับ Personal Apple ID เพื่อเสถียรภาพสูงสุด

---

## 8. บันทึกข้อค้นพบและบทเรียนจากการพัฒนาจริง (Key Insights & Technical Findings)

### 1. ข้อค้นพบเรื่อง Battery Optimization บน Android (OS-Level Task Killer)
- **ปัญหา:** สมาร์ตโฟนระบบ Android ยี่ห้อต่างๆ (โดยเฉพาะ Xiaomi, Oppo, Vivo, Samsung One UI) มีนโยบายประหยัดแบตเตอรี่เชิงรุก (Aggressive Battery Saver) ซึ่งจะสั่ง "ฆ่า" (Kill) Foreground Service ทันทีที่จอดับเกิน 2–3 นาที แม้จะมีแถบ Notification หล่อเลี้ยงอยู่ก็ตาม
- **วิธีแก้ที่นำไปปฏิบัติ:**
  1. เพิ่มสิทธิ์ `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` และ `POST_NOTIFICATIONS` ใน `AndroidManifest.xml`
  2. เพิ่มตัวตรวจจับสถานะแบตเตอรี่ใน [sensor_manager.dart](file:///c:/Users/USER/Desktop/RSSI%20GPS%20Application/rssi_logger/lib/sensor_manager.dart) เพื่อแสดงแบนเนอร์สีส้มแจ้งเตือนบนหน้า Dashboard ทันทีที่เครื่องยังไม่ได้ยกเว้นการจำกัดพลังงาน
  3. เพิ่มคู่มือตั้งค่าเครื่อง (Setup Guide Modal) ให้ผู้ใช้กดปุ่มเดียวเพื่อขอยกเว้นการจำกัดพลังงานเป็น "ไม่จำกัด" (Unrestricted) ได้ทันที

### 2. ข้อค้นพบและข้อจำกัดของ iOS สำหรับงานวิจัย (Hard Constraints & Participant Usability)
- **ข้อจำกัดในการสแกน Wi-Fi:** Apple ไม่อนุญาตให้แอปภายนอกดึงค่า Wi-Fi RSSI เบื้องหลังได้เองโดยตรง จึงจำเป็นต้องให้ผู้ใช้รันผ่าน Apple Shortcuts (Get Network Details) แล้วส่งค่ากลับมาที่แอปผ่าน `LogWifiSampleIntent` หรือ URL Scheme `rssilogger://wifi`
- **ข้อจำกัดในการแจกจ่ายแอปให้ผู้ร่วมทดลอง (Distribution Friction):**
  - *การแจกจ่ายผ่าน Apple TestFlight:* มีค่าใช้จ่าย Apple Developer Program ($99/ปี หรือ ~3,500 บาท/ปี)
  - *การลงแอปนอกสโตร์ (Sideloading):* ต้องใช้คอมพิวเตอร์, เสียบสาย USB, กรอกรหัส Apple ID + 2FA, และเปิด Developer Mode ซึ่งซับซ้อนสำหรับผู้ใช้ทั่วไป แต่**สามารถทำได้ง่ายสำหรับกลุ่มตัวอย่างที่เป็นนักศึกษาวิศวกรรมคอมพิวเตอร์**
- **แนวทางการแจกจ่ายแอปที่เลือกใช้จริง (Selected Distribution Strategy - ฟรี 0 บาท):**
  - **กลุ่มเป้าหมาย:** เนื่องจากอาสาสมัครผู้เข้าร่วมการทดลองเป็น **นักศึกษาวิศวกรรมคอมพิวเตอร์** ซึ่งมีความคุ้นเคยกับ GitHub และมีคอมพิวเตอร์ส่วนตัวอยู่แล้ว จึงกำหนดให้ติดตั้งผ่าน **GitHub Releases** ทั้งหมด
  - **ฝั่ง Android:** ดาวน์โหลดไฟล์ `app-release.apk` จาก GitHub Releases ไปติดตั้งลงเครื่องแบบ Offline ได้ทันที
  - **ฝั่ง iOS:** ดาวน์โหลดไฟล์ `.ipa` (ที่บิลด์อัตโนมัติจาก GitHub Actions `build_ios.yml`) ไปติดตั้งผ่านโปรแกรม **Sideloadly** บนคอมพิวเตอร์ของนักศึกษาแต่ละคนโดยใช้ **Free Apple ID ส่วนตัว** (ช่วยแก้ปัญหาโควตาจำกัด 3 เครื่อง/สัปดาห์ของบัญชีฟรี และไม่ต้องเสียค่าสมัคร $99/ปี)
  - **การลดความผิดพลาดในการตั้งค่า Shortcuts:** แจกจ่ายเป็นลิงก์ **iCloud Shortcut สำเร็จรูป** ไว้ในหน้า `README.md` เพื่อให้นักศึกษากดรับคำสั่งลัดเข้าเครื่องได้ทันทีโดยไม่ต้องต่อบล็อกคำสั่งเอง

### 3. ข้อค้นพบด้าน In-App Dynamic Configuration
- **ปัญหา:** หาก Hardcode URL ของ Google Apps Script ไว้ในโค้ด แล้ววันใดวันหนึ่งโฟลเดอร์ Google Drive เต็ม หรือผู้วิจัยเปลี่ยน Web App URL ปลายทาง ผู้วิจัยจะต้องคอมไพล์ APK ใหม่และส่งให้ผู้ร่วมทดลองทุกคนลงแอปใหม่ซ้ำซ้อน
- **วิธีแก้ที่นำไปปฏิบัติ:** แยก Web App URL และ Sampling Rate ออกมาเก็บลง `SharedPreferences` ผ่านหน้า `SettingsPage` ทำให้เปลี่ยนปลายทางและทดสอบการเชื่อมต่อได้สดๆ จากหน้าจอแอป

### 4. ระบบป้องกันข้อมูลสูญหาย (Zero Data Loss Policy)
- ข้อมูล CSV ที่แปลงแล้วจะถูกเก็บถาวรไว้ใน Local Storage ของเครื่องเสมอ และจะไม่มีการลบอัตโนมัติแม้จะอัปโหลดขึ้น Drive สำเร็จ เพื่อป้องกันกรณีเน็ตหลุดหรือข้อมูลบน Drive สูญหาย
- เพิ่มหน้าจอ History พร้อมฟีเจอร์ Smart Action Bar ให้ผู้ใช้สามารถเลือกหลายไฟล์พร้อมกันเพื่อกด Sync All ย้อนหลัง หรือเลือกลบไฟล์ออกจากเครื่องด้วยตนเองเมื่อยืนยันความถูกต้องใน Drive แล้ว

### 5. ข้อค้นพบด้านการซิงโครไนซ์ข้อมูลเซ็นเซอร์และการแยกคอลัมน์โหมด (Sensor Sync & Label Architecture)
- **ปัญหาเดิม (Asynchronous Sparse Events & Blank Cells):** เดิมเซ็นเซอร์แต่ละตัว (GPS, IMU, Wi-Fi) ส่ง Event ด้วยความถี่ต่างกันและบันทึกแยกแถวลง SQLite ทำให้ไฟล์ CSV มีเซลล์ว่าง (NULL / Empty cells) จำนวนมาก และหน้า Dashboard แสดงผลสลับกระพริบไม่พร้อมกัน
- **วิธีแก้ที่นำไปปฏิบัติ:**
  1. สร้าง **Periodic Synchronized Snapshot Engine** (`_takeSynchronizedSnapshot`) ทำงานทุก 1 วินาที โดยจับ State ล่าสุดของ GPS, Wi-Fi, และ IMU มาประกอบเป็น 1 Record สมบูรณ์ (`type: 'sync_sample'`) พร้อมกัน
  2. เพิ่ม **Forward-Fill Mechanism** ใน `ExportManager` ในขั้นตอนแปลงเป็น CSV เพื่อให้ได้แถวข้อมูลที่สมบูรณ์ 100% ปราศจากช่องว่าง (Zero Blanks) พร้อมเข้าโมเดล ML ทันที
  3. **การแยกคอลัมน์ป้ายกำกับอย่างเด็ดขาด:** เพื่อให้โมเดล ML มีเป้าหมาย (Target) ชัดเจน จึงแยกออกเป็น 2 คอลัมน์:
     - `user_label_mode`: สิ่งที่ผู้ใช้ระบุเอง เช่น เดิน, ปั่นจักรยาน, ขี่มอเตอร์ไซค์, ขับรถ (ใช้เป็น **Ground Truth Label**)
     - `activity_recognition_mode`: สิ่งที่ระบบ OS เดาได้จาก Activity Recognition API (ใช้เป็น **Baseline Benchmark**)
  4. **ปลดล็อคการเปลี่ยนโหมด (Unrestricted Mode Selection):** แก้ไขให้ผู้ใช้เลือกโหมดล่วงหน้าได้ก่อนเริ่มทริป, แตะ Quick Tag สลับโหมดขณะเดินทาง, และแก้ไขโหมดหลังจบการบันทึกได้ทันที โดยไม่มีการค้างสถานะ

### 6. ข้อค้นพบด้านการติดตั้ง iOS ผ่าน Scarlet บนมือถือโดยตรง และ UIScene Lifecycle Crash
- **ปัญหาแอปแครชหน้าขาว (Crash on Launch):** โครงสร้าง iOS รุ่นใหม่ที่ใช้ `UIScene` จะเรียก `didFinishLaunchingWithOptions` ก่อนที่ Flutter Engine จะถูกสร้าง การเรียก `GeneratedPluginRegistrant.register(with: self)` ในจังหวะนั้นจะทำให้เกิด `EXC_BAD_ACCESS` แครชทันที
- **วิธีแก้ที่นำไปปฏิบัติ:** ย้ายการ Register Plugin ไปอยู่ใน `didInitializeImplicitFlutterEngine` ตามโปรโตคอล `FlutterImplicitEngineDelegate` และส่งต่อ URL Scheme ใน `SceneDelegate.swift`
- **การติดตั้งผ่านแอป Scarlet โดยตรง (No-PC Sideloading):** ผู้ใช้สามารถติดตั้งแอป Scarlet บน iPhone เพื่อ Import ไฟล์ `Runner.ipa` ได้โดยตรงโดยไม่ต้องใช้คอมพิวเตอร์ตามแนวทางในคลิป [YouTube Shorts](https://www.youtube.com/shorts/Q2H62epJGB8) โดยต้องกดยอมรับ Trust Enterprise Certificate ในเครื่อง และเปิด Developer Mode บน iOS 16+

### 7. ข้อค้นพบด้านการคงอยู่ของรหัสผู้เข้าร่วมวิจัยเมื่อใบรับรองหมดอายุ (Persistent Participant ID & App Reinstall Resilience)
- **ปัญหา:** เมื่อใบรับรององค์กรสาธารณะ (Enterprise Certificate) ของแอป Scarlet ถูก Apple ระงับ (Revoke) ผู้ใช้จะไม่สามารถเปิดแอปได้ และหลายคนมีแนวโน้มที่จะ "ลบแอปทิ้งแล้วลงใหม่" ซึ่งทำให้ไฟล์ภายในเครื่อง (Sandbox) และรหัสสุ่มใน `SharedPreferences` สูญหาย ส่งผลให้รอบการเก็บข้อมูลถัดไปมี `participant_id` ไม่ตรงกับข้อมูลเดิม
- **วิธีแก้ที่นำไปปฏิบัติ (กลยุทธ์ Hybrid):**
  1. **iOS Keychain Storage:** ใช้ `flutter_secure_storage` บันทึก `participant_id` ลงใน Keychain ซึ่งระบบปฏิบัติการ iOS จะ**ไม่ลบข้อมูลใน Keychain ทิ้งเมื่อแอปถูก Uninstall** ทำให้เมื่อลงแอปใหม่ ระบบดึงรหัสเดิมกลับมาทำงานต่อได้ 100%
  2. **Android Hardware ID:** บน Android ดึงค่า `Settings.Secure.ANDROID_ID` ผ่าน Platform MethodChannel เป็นค่าเริ่มต้น ซึ่งคงเดิมตลอดอายุเครื่องแม้จะลบ-ลงใหม่กี่ครั้ง
  3. **Editable USER ID Field:** ปลดล็อคกล่องข้อความบนหน้า Dashboard ให้สามารถแตะแก้ไขได้ตลอดเวลา เพื่อให้ผู้เข้าร่วมสามารถตรวจสอบหรือกรอกรหัสเดิม (เช่น รหัสนักศึกษา) กลับเข้าไปได้ในทุกสถานการณ์

---

## 9. สถาปัตยกรรมข้อมูลและการออกแบบด้าน AI/ML

**Remark (การออกแบบด้าน ML / AI): Hardware-Agnostic Approach**
โมเดล AI จะถูกฝึกสอน (Train) ให้แยกแยะการเดินทางจาก **"Pattern ความผันผวนของ RSSI เท่านั้น"** โดย**ไม่นำข้อมูล Hardware (รุ่นมือถือ) มาเป็นตัวแปร (Feature) ในการพิจารณา** เพื่อให้ได้โมเดลที่เป็น Universal (ใช้งานได้กับทุกเครื่อง) ส่วนการที่เรายังเก็บชื่อรุ่นมือถือซ่อนไว้ในไฟล์ CSV นั้น มีไว้เพียงเพื่อการประเมินผล (Evaluation/Debugging) ในภายหลังเท่านั้น เช่น ไว้สำหรับพิสูจน์ในเล่มวิจัยว่า "โมเดลของเราแม่นยำจริงในมือถือต่างระบบปฏิบัติการ"

**Remark (Cloud Storage & Sync Architecture): Google Drive + GAS**
ระบบท่อส่งข้อมูลใช้ **Google Drive + Google Apps Script (GAS)** ฟรี 100% (ไม่ต้องผูกบัตรเครดิต)
- **Google Drive Folder ID:** `1DtbWXEuofNvZINSBrmXzn5CnXdzPzjFQ`
- **GAS Web App URL เริ่มต้น:** `https://script.google.com/macros/s/AKfycbwry_goxlTURpP6xBBi6jvTBfGNrhppeS4xQtPEoBVae52dNa0DnfblQgJDzj-TE_Dr/exec`

1. **โครงสร้างโฟลเดอร์สำหรับงานวิจัย:**
   - โครงสร้าง: `dataset / {Platform} / {DeviceModel} / {ParticipantID} / rssi_trip_{timestamp}.csv.zip`
   - เอื้อให้นักพัฒนา ML ดึงไปใช้ทำ Leave-One-Subject-Out Cross-Validation (LOSO CV) ได้ทันที
2. **ระบบบีบอัดข้อมูล (In-Memory ZIP):**
   - โหลด CSV ขึ้น RAM และบีบอัด Zip ในหน่วยความจำโดยตรง เพื่อแก้ปัญหา Path ซ้อนทับและไฟล์ Zip ว่างเปล่าบน Android ลดขนาดไฟล์จาก ~30MB/ชม. เหลือ ~5MB/ชม.

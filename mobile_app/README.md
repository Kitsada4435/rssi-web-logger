# RSSI & GPS Multi-Sensor Logger

<p align="center">
  <b>Synchronized Multi-Sensor Logging System (Millisecond Precision)</b><br>
  For Indoor/Outdoor Positioning, Wi-Fi Fingerprinting, and Travel Mode Inference Research.<br><br>
  <a href="#-english"><b>[ 🇬🇧 English Version ]</b></a> &nbsp; | &nbsp; <a href="#-ภาษาไทย"><b>[ 🇹🇭 ฉบับภาษาไทย ]</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Framework-Flutter-02569B.svg" alt="Framework" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57.svg" alt="Database" />
  <img src="https://img.shields.io/badge/License-Academic%20Research-green.svg" alt="License" />
</p>

---

# 🇬🇧 English

## Table of Contents
- [Project Documentation by Phase](#project-documentation-by-phase)
- [System Overview & Capabilities](#system-overview--capabilities)
- [CSV Data Schema](#csv-data-schema)
- [Download Links](#download-links)
- [Installation & Permission Guide](#installation--permission-guide)
  - [1. Android Setup](#1-android-setup)
  - [2. iOS Setup (iPhone)](#2-ios-setup-iphone)
- [Field Data Collection Protocol (iOS)](#field-data-collection-protocol-ios)
- [System Changelog](#system-changelog)

---

## Project Documentation by Phase

| Phase | Document | Status | Description |
|:---|:---|:---|:---|
| **Phase 0** | [Phase_0_Research_Proposal_And_Specs.md](../Phase_0_Research_Proposal_And_Specs.md) | Completed | Research proposal, theoretical frameworks, baseline literature, and system specifications. |
| **Phase 1** | [Phase_1_App_Development_And_Pipeline.md](../Phase_1_App_Development_And_Pipeline.md) | Completed | Application development logs, sensor synchronization pipeline, cloud architecture, and CI/CD. |
| **Phase 2** | [Phase_2_Data_Collection_And_ML_Pipeline.md](../Phase_2_Data_Collection_And_ML_Pipeline.md) | In Progress | Field data collection plan, preprocessing pipelines, and ML/AI model training. |

---

## System Overview & Capabilities

- **GPS & Motion Sensors:** Records geographic coordinates (`Latitude`, `Longitude`), `Speed`, and `Accuracy` synchronized with 6-DOF IMU readings (`Accelerometer X/Y/Z` and `Gyroscope X/Y/Z`).
- **Wi-Fi Signal Logging:** Captures Wi-Fi Received Signal Strength Indication (`RSSI` in dBm), Access Point MAC Address (`BSSID`), and network name (`SSID`).
- **User & Context Tagging:** Supports real-time mobility annotations (`Walk`, `Bike`, `Motorcycle`, `Car`), device carrying positions (`Pocket`, `Hand`, `Bag`), and participant identifier (`Participant ID`).
- **Local Storage & CSV Export:** Stores data locally in an SQLite database with instantaneous CSV export and cloud-sync readiness.

---

## CSV Data Schema

Exported CSV files adhere to the following unified schema:

| Column Name | Description | Example Value |
|:---|:---|:---|
| `t_utc_ms` | Universal Coordinated Time timestamp (Milliseconds) | `1729420000000` |
| `t_mono_ns` | Hardware Monotonic Clock (Nanoseconds) | `184729104820` |
| `session_id` | Unique identifier for the logging trip | `1729420000000` |
| `participant_id` | Assigned participant identifier | `std_64010123` |
| `platform` / `device_model` / `os_version` | Hardware and operating system specifications | `ios`, `iPhone15,5`, `18.1` |
| `lat` / `lon` / `speed` / `accuracy` | GPS coordinates, travel speed, and horizontal accuracy | `18.79592`, `98.95267`, `1.79`, `9.5` |
| `accel_x, y, z` | 3-axis linear acceleration ($m/s^2$) | `0.21`, `0.08`, `9.81` |
| `gyro_x, y, z` | 3-axis angular velocity ($rad/s$) | `0.01`, `-0.02`, `0.00` |
| `bssid` | Hardware MAC address of the connected Wi-Fi AP | `aa:bb:cc:dd:ee:ff` |
| `ssid` | Wireless network name (SSID) | `Campus-WiFi` |
| `rssi_raw` | Measured Wi-Fi signal strength (dBm) | `-45` |
| `rssi_source` | Acquisition protocol/channel | `wifimanager` (Android) / `shortcut` (iOS) |
| `user_label_mode` / `phone_position` | Transportation mode tag and device location | `walk`, `pocket` |

---

## Download Links

Download installation binaries and automated shortcut workflows directly:

| Platform / Tool | Target File | Direct Download |
|:---|:---|:---|
| **Android** | `app-release.apk` | [Download APK](https://github.com/Kitsada4435/rssi_logger_app/raw/main/app-release.apk) |
| **iOS (Application)** | `Runner.ipa` | [Download IPA (Releases)](https://github.com/Kitsada4435/rssi_logger_app/releases/download/v1.0.0/Runner.ipa) |
| **iOS (Shortcuts)** | `Send Rssi Logger App.shortcut` | [Download Shortcut (Safari)](https://github.com/Kitsada4435/rssi_logger_app/raw/main/Send%20Rssi%20Logger%20App.shortcut) |

---

## Installation & Permission Guide

### 1. Android Setup

1. Download and install [app-release.apk](https://github.com/Kitsada4435/rssi_logger_app/raw/main/app-release.apk).
2. Launch the app and set **Location Permission** to **"Allow all the time"** for background recording.
3. Enter your **Participant ID** and select your initial transportation mode.
4. Tap **START TRIP** to commence recording (modes can be switched seamlessly during travel).
5. Tap **STOP TRIP** upon arrival; session data will automatically compile into a CSV file.

---

### 2. iOS Setup (iPhone)

Due to iOS security policies preventing third-party apps from querying raw Wi-Fi metrics directly, the system uses a custom bridge via **Apple Shortcuts**:

#### Step 1: Install the RSSI Logger App

* **Recommended (Direct on-device via Scarlet, no PC required):**  
  Follow the video instructions: **[Scarlet Installation Guide (YouTube Shorts)](https://www.youtube.com/shorts/Q2H62epJGB8)**  
  1. Install the Scarlet app following the video guide.
  2. Navigate to `Settings` > `General` > `VPN & Device Management` > Tap **Trust** on the certificate.
  3. Download [Runner.ipa](https://github.com/Kitsada4435/rssi_logger_app/releases/download/v1.0.0/Runner.ipa) to the iPhone **Files** app.
  4. Open **Scarlet** > Tap the **Import** icon (top right) > Select `Runner.ipa` > Tap **Install** once loading hits 100%.
  5. For iOS 16+: Go to `Settings` > `Privacy & Security` > Turn ON **Developer Mode** and restart the device when prompted.

* **Alternative (Via PC using Sideloadly):**  
  1. Download [Sideloadly](https://sideloadly.io/) and connect your iPhone via USB.
  2. Drag `Runner.ipa` into Sideloadly, provide your Apple ID, and click **Start**.
  3. Open `Settings` > `General` > `VPN & Device Management` on iPhone and tap **Trust**.

> [!TIP]
> **If Scarlet certificate expires ("Unable to Verify App"):**  
> Simply wait for Scarlet to renew its certificate and re-install/import `Runner.ipa`.  
> **No worry about losing your ID:** `participant_id` is permanently anchored to the **iOS Keychain**. Even if you delete and reinstall the app, your unique participant identifier will automatically restore 100%!

#### Step 2: Install Apple Shortcut
1. Open the following link in **Safari on iPhone**: [Download Send Rssi Logger App.shortcut](https://github.com/Kitsada4435/rssi_logger_app/raw/main/Send%20Rssi%20Logger%20App.shortcut)
2. Tap download and open the file; the Shortcuts app will launch automatically.
3. Tap **"Add Shortcut"**.

#### Step 3: Permissions Configuration

**RSSI Logger App Permissions:**
1. Open `Settings` > Select **RSSI Logger**.
2. **Location:** Select **"Always"** (or "While Using") and enable **"Precise Location"**.
3. **Motion & Fitness:** Set to **Enabled** (for accelerometer and gyroscope metrics).
4. **Background App Refresh:** Set to **Enabled**.

**Shortcuts App Permissions:**
1. Open `Settings` > `Privacy & Security` > `Location Services`.
2. Tap **Shortcuts** > Select **"While Using the App"** *(Required for BSSID/MAC reading)*.
3. Open `Settings` > `Shortcuts` > `Advanced` > Enable **"Allow Sharing Large Amounts of Data"**.
4. When executing the shortcut for the first time, select **"Always Allow"** when prompted.

#### Step 4: Shortcut Execution Logic
```text
Repeat 3,600 times (1-second sampling interval)
├── Fetch Wi-Fi BSSID -> Set variable: BSSID
├── Fetch Wi-Fi SSID -> Set variable: SSID
├── Fetch Wi-Fi RSSI -> Set variable: RSSI
├── Construct URL Scheme:
│   └── rssilogger://wifi?bssid=[BSSID]&ssid=[SSID]&rssi=[RSSI]
├── Open URL in RSSI Logger App
└── Wait 1 second
```

---

## Field Data Collection Protocol (iOS)

1. **Initiate Shortcut:**
   - Open **Shortcuts** app and tap **Send Rssi Logger App**.
   - When asked for confirmation, select **"Always Allow"**.
2. **Start Trip:**
   - The device will automatically switch to **RSSI Logger**.
   - Select your starting travel mode and tap **START TRIP**.

> [!TIP]
> **Real-time Mode Switching:** You can tap different mode buttons (`Walk`, `Bike`, `Moto`, `Car`) on-the-fly during transit without stopping the session. The `user_label_mode` tag updates synchronously.

> [!IMPORTANT]
> **Keep Screen Active:** The RSSI Logger app MUST remain in the foreground during recording. Do not lock the screen or switch apps, ensuring uninterrupted signal passing from Shortcuts and preventing iOS memory suspension.

3. **Complete Trip:**
   - Tap **STOP TRIP** in RSSI Logger to generate the CSV dataset.
   - Switch back to the Shortcuts app and tap **Stop**.

---

- **Persistent Participant ID & App Reinstall Resilience:** Integrated `flutter_secure_storage` with iOS Keychain and Android Hardware ID (`Settings.Secure.ANDROID_ID`). Participant identifier persists across app uninstalls and certificate revocations.
- **Editable USER ID Field:** Made the Participant ID text box fully editable on the dashboard for manual verification and cross-device consistency.
- **Multi-Sensor Synchronization on iOS:** Full synchronization between BSSID, SSID, RSSI (dBm), GPS, and 6-DOF IMU via Apple Shortcuts bridge.
- **Trip Counter Initialization Fix:** Record counter logic updated to strictly initialize at 0 upon every new trip start.
- **URL Scheme Handling:** Enhanced URL Scheme parser on iOS to be case-insensitive and auto-trim whitespace parameters.

---
---

# 🇹🇭 ภาษาไทย

## สารบัญ
- [เอกสารประกอบโครงการตามลำดับขั้นตอน](#เอกสารประกอบโครงการตามลำดับขั้นตอน)
- [ภาพรวมและความสามารถของระบบ](#ภาพรวมและความสามารถของระบบ)
- [โครงสร้างข้อมูลในไฟล์ CSV](#โครงสร้างข้อมูลในไฟล์-csv)
- [ลิงก์ดาวน์โหลด](#ลิงก์ดาวน์โหลด)
- [คู่มือการติดตั้งและการตั้งค่าสิทธิ์](#คู่มือการติดตั้งและการตั้งค่าสิทธิ์)
  - [1. ระบบปฏิบัติการ Android](#1-ระบบปฏิบัติการ-android)
  - [2. ระบบปฏิบัติการ iOS (iPhone)](#2-ระบบปฏิบัติการ-ios-iphone)
- [ขั้นตอนการบันทึกข้อมูลภาคสนาม (iOS)](#ขั้นตอนการบันทึกข้อมูลภาคสนาม-ios)
- [ประวัติการปรับปรุงระบบ](#ประวัติการปรับปรุงระบบ)

---

## เอกสารประกอบโครงการตามลำดับขั้นตอน

| ลำดับเฟส | เอกสาร | สถานะ | รายละเอียด |
|:---|:---|:---|:---|
| **Phase 0** | [Phase_0_Research_Proposal_And_Specs.md](../Phase_0_Research_Proposal_And_Specs.md) | เสร็จสมบูรณ์ | ข้อเสนอโครงการวิจัย กรอบแนวคิดเชิงทฤษฎี งานวิจัยอ้างอิง และสเปกระบบ |
| **Phase 1** | [Phase_1_App_Development_And_Pipeline.md](../Phase_1_App_Development_And_Pipeline.md) | เสร็จสมบูรณ์ | บันทึกการพัฒนาแอปพลิเคชัน การซิงค์เซ็นเซอร์ สถาปัตยกรรมคลาวด์ และ CI/CD |
| **Phase 2** | [Phase_2_Data_Collection_And_ML_Pipeline.md](../Phase_2_Data_Collection_And_ML_Pipeline.md) | กำลังดำเนินการ | แผนการเก็บข้อมูลภาคสนาม การเตรียมข้อมูล (Preprocessing) และการฝึกสอนโมเดล ML |

---

## ภาพรวมและความสามารถของระบบ

- **บันทึกพิกัด GPS และการเคลื่อนไหว:** บันทึกละติจูด, ลองจิจูด, ความเร็ว และความแม่นยำ ทุกวินาที ซิงค์พร้อมกับเซ็นเซอร์ IMU 6 แกน (ความเร่ง Accelerometer X/Y/Z และความเร็วเชิงมุม Gyroscope X/Y/Z)
- **บันทึกสัญญาณ Wi-Fi:** บันทึกระดับความแรงสัญญาณ RSSI (dBm), MAC Address ของอุปกรณ์กระจายสัญญาณ (BSSID) และชื่อเครือข่าย (SSID)
- **ระบุบริบทการเดินทาง:** เลือกระบุรูปแบบการเดินทาง (Walk, Run, Bike, Motorcycle, Car), ตำแหน่งพกพาโทรศัพท์ (Pocket, Hand, Bag) และรหัสผู้เข้าร่วมทดลอง (Participant ID)
- **จัดเก็บข้อมูลและส่งออกไฟล์:** จัดเก็บข้อมูลลงฐานข้อมูล SQLite ภายในอุปกรณ์ทันที พร้อมปุ่มส่งออกเป็นไฟล์ CSV และรองรับการเชื่อมต่อคลาวด์

---

## โครงสร้างข้อมูลในไฟล์ CSV

ไฟล์ข้อมูลส่งออก (CSV) มีโครงสร้างคอลัมน์มาตรฐานดังนี้:

| ชื่อคอลัมน์ | คำอธิบาย | ตัวอย่างข้อมูล |
|:---|:---|:---|
| `t_utc_ms` | ค่าเวลามาตรฐานสากล UTC (มิลลิวินาที) | `1729420000000` |
| `t_mono_ns` | ค่าเวลานาฬิกาฮาร์ดแวร์ Monotonic Clock (นาโนวินาที) | `184729104820` |
| `session_id` | รหัสรอบการบันทึกข้อมูล (Trip ID) | `1729420000000` |
| `participant_id` | รหัสประจำตัวผู้ทดสอบ | `std_64010123` |
| `platform` / `device_model` / `os_version` | รายละเอียดระบบปฏิบัติการ รุ่นอุปกรณ์ และเวอร์ชัน OS | `ios`, `iPhone15,5`, `18.1` |
| `lat` / `lon` / `speed` / `accuracy` | พิกัด ความเร็ว และความแม่นยำจาก GPS | `18.79592`, `98.95267`, `1.79`, `9.5` |
| `accel_x, y, z` | ค่าความเร่งตามแนวแกนสามมิติ (m/s²) | `0.21`, `0.08`, `9.81` |
| `gyro_x, y, z` | ค่าความเร็วเชิงมุมรอบแกนสามมิติ (rad/s) | `0.01`, `-0.02`, `0.00` |
| `bssid` | ที่อยู่ทางกายภาพ (MAC Address) ของเราเตอร์ Wi-Fi | `aa:bb:cc:dd:ee:ff` |
| `ssid` | ชื่อเครือข่าย Wi-Fi | `Campus-WiFi` |
| `rssi_raw` | ระดับความแรงสัญญาณ Wi-Fi ที่วัดได้ (dBm) | `-45` |
| `rssi_source` | ช่องทางที่ได้รับข้อมูลสัญญาณ | `wifimanager` (Android) / `shortcut` (iOS) |
| `user_label_mode` / `phone_position` | ป้ายกำกับโหมดการเดินทางและตำแหน่งจัดเก็บเครื่อง | `walk`, `pocket` |

---

## ลิงก์ดาวน์โหลด

| แพลตฟอร์ม / เครื่องมือ | ไฟล์ติดตั้ง | ลิงก์ดาวน์โหลด |
|:---|:---|:---|
| **Android** | `app-release.apk` | [ดาวน์โหลดไฟล์ APK โดยตรง](https://github.com/Kitsada4435/rssi_logger_app/raw/main/app-release.apk) |
| **iOS (แอปพลิเคชัน)** | `Runner.ipa` | [ดาวน์โหลดไฟล์ IPA จาก Releases](https://github.com/Kitsada4435/rssi_logger_app/releases/download/v1.0.0/Runner.ipa) |
| **iOS (คำสั่งลัด)** | `Send Rssi Logger App.shortcut` | [ดาวน์โหลดคำสั่งลัดผ่าน Safari](https://github.com/Kitsada4435/rssi_logger_app/raw/main/Send%20Rssi%20Logger%20App.shortcut) |

---

## คู่มือการติดตั้งและการตั้งค่าสิทธิ์

### 1. ระบบปฏิบัติการ Android

1. ดาวน์โหลดไฟล์ [app-release.apk](https://github.com/Kitsada4435/rssi_logger_app/raw/main/app-release.apk) และติดตั้งลงบนอุปกรณ์
2. เปิดแอปพลิเคชัน และกำหนดสิทธิ์ **ตำแหน่งที่ตั้ง (Location)** เป็น **"อนุญาตตลอดเวลา" (Allow all the time)** เพื่อให้ระบบบันทึกพิกัดต่อเนื่องขณะปิดหน้าจอหรือสลับแอป
3. ระบุ **Participant ID** และเลือกโหมดการเดินทางเริ่มต้น
4. กดปุ่ม **START TRIP** เพื่อเริ่มบันทึกข้อมูล (สามารถแตะเปลี่ยนโหมดการเดินทางระหว่างบันทึกได้ตลอดเวลา)
5. เมื่อเสร็จสิ้นรอบ ให้กดปุ่ม **STOP TRIP** ข้อมูลจะถูกบันทึกและแปลงเป็นไฟล์ CSV โดยอัตโนมัติ

---

### 2. ระบบปฏิบัติการ iOS (iPhone)

เนื่องจากระบบความปลอดภัยของ iOS ไม่อนุญาตให้แอปพลิเคชันทั่วไปเข้าถึงข้อมูล Wi-Fi โดยตรง จึงจำเป็นต้องใช้งานควบคู่กับ **Apple Shortcuts** ในการดึงข้อมูลสัญญาณ Wi-Fi แล้วส่งเข้าสู่แอปพลิเคชัน:

#### ขั้นตอนที่ 1: ติดตั้งแอปพลิเคชัน RSSI Logger

* **วิธีหลัก (แนะนำ - ติดตั้งบน iPhone โดยตรง ไม่ต้องใช้คอมพิวเตอร์): ติดตั้งผ่าน Scarlet**  
  สามารถดูวิดีโอสาธิตขั้นตอนการติดตั้งได้ที่:  
  **[วิดีโอสาธิตการติดตั้ง Scarlet (YouTube Shorts)](https://www.youtube.com/shorts/Q2H62epJGB8)**  
  1. ติดตั้งแอป Scarlet ตามขั้นตอนในคลิปวิดีโอ
  2. ไปที่ `Settings (การตั้งค่า)` > `General (ทั่วไป)` > `VPN & Device Management` แล้วกดยืนยัน **Trust (เชื่อถือ)** ใบรับรองของ Scarlet
  3. ดาวน์โหลดไฟล์ [Runner.ipa](https://github.com/Kitsada4435/rssi_logger_app/releases/download/v1.0.0/Runner.ipa) บันทึกไว้ในแอป Files บน iPhone
  4. เปิดแอป **Scarlet** > กดไอคอน **Import** (มุมบนขวา) > เลือกไฟล์ `Runner.ipa` > เมื่อดาวน์โหลดครบ 100% ให้กด **Install**
  5. สำหรับ iOS 16 ขึ้นไป: ไปที่ `Settings` > `Privacy & Security` > เปิด **Developer Mode** > ระบบจะทำการรีสตาร์ทเครื่องและกดยืนยันเปิดใช้งาน

* **วิธีสำรอง (ติดตั้งผ่านคอมพิวเตอร์ด้วย Sideloadly):**  
  1. ดาวน์โหลดโปรแกรม [Sideloadly](https://sideloadly.io/) ติดตั้งลงบนคอมพิวเตอร์ และเชื่อมต่อ iPhone ด้วยสายเคเบิล
  2. ลากไฟล์ `Runner.ipa` เข้าสู่โปรแกรม ระบุ Apple ID และกด **Start**
  3. ไปที่ `Settings` > `General` > `VPN & Device Management` บน iPhone แล้วกดยืนยัน **Trust**

> [!TIP]
> **กรณีใบรับรองของ Scarlet หมดอายุ (Unable to Verify App):**  
> ให้ทำการติดตั้งแอป Scarlet เวอร์ชันใหม่ล่าสุด จากนั้นเปิดแอป Scarlet แล้วทำการนำเข้าและติดตั้งไฟล์ `Runner.ipa` ซ้ำอีกครั้ง  
> **ไม่ต้องกังวลเรื่องรหัสผู้ใช้งานสูญหาย:** เนื่องจากระบบได้บันทึกรหัส `participant_id` ไว้ใน **iOS Keychain** อย่างถาวร ต่อให้ลบแอปแล้วติดตั้งใหม่ รหัสเดิมจะถูกกู้คืนกลับมาใช้งานอัตโนมัติ 100%

#### ขั้นตอนที่ 2: ติดตั้งคำสั่งลัด (Apple Shortcuts)
1. ใช้เบราว์เซอร์ **Safari บน iPhone** เปิดลิงก์: [ดาวน์โหลดคำสั่งลัด Send Rssi Logger App](https://github.com/Kitsada4435/rssi_logger_app/raw/main/Send%20Rssi%20Logger%20App.shortcut)
2. กดยืนยันดาวน์โหลด เมื่อระบบเปิดเข้าแอปคำสั่งลัด ให้กด **"เพิ่มคำสั่งลัด" (Add Shortcut)**

#### ขั้นตอนที่ 3: การกำหนดสิทธิ์การเข้าถึงข้อมูล (Permissions Setup)

**การตั้งค่าสิทธิ์สำหรับแอป RSSI Logger:**
1. ไปที่ `Settings (การตั้งค่า)` > เลือกแอปพลิเคชัน **RSSI Logger**
2. **ตำแหน่งที่ตั้ง (Location):** เลือกเป็น **"ตลอดเวลา" (Always)** หรือ **"ในระหว่างใช้แอป"** พร้อมเปิดใช้งาน **"ตำแหน่งที่ตั้งที่แน่นอน" (Precise Location)**
3. **การเคลื่อนไหวและฟิตเนส (Motion & Fitness):** กำหนดเป็น **เปิด (Enabled)** สำหรับบันทึกค่าความเร่งและการหมุนตัว
4. **การดึงข้อมูลจากเบื้องหลัง (Background App Refresh):** กำหนดเป็น **เปิด (Enabled)**

**การตั้งค่าสิทธิ์สำหรับแอปคำสั่งลัด (Apple Shortcuts):**
1. ไปที่ `Settings` > `Privacy & Security (ความเป็นส่วนตัวและความปลอดภัย)` > `Location Services (บริการหาตำแหน่งที่ตั้ง)`
2. เลือก **คำสั่งลัด (Shortcuts)** > กำหนดเป็น **"ในระหว่างใช้แอป" (While Using the App)** *(จำเป็นต่อการอ่านค่า BSSID / MAC Address)*
3. ไปที่ `Settings` > `คำสั่งลัด (Shortcuts)` > `ขั้นสูง (Advanced)` > เปิด **"อนุญาตให้แชร์ข้อมูลจำนวนมาก" (Allow Sharing Large Amounts of Data)**
4. เมื่อสั่งรันคำสั่งลัดครั้งแรกและมีหน้าต่างขออนุญาตส่งข้อมูล ให้เลือก **"อนุญาตเสมอ" (Always Allow)**

#### ขั้นตอนที่ 4: โครงสร้างการทำงานของคำสั่งลัด (Shortcut Flow Diagram)
```text
ทำซ้ำ 3,600 รอบ (ความถี่รอบละ 1 วินาที รวม 1 ชั่วโมง)
├── ดึงข้อมูล MAC Address (BSSID) จากเครือข่าย Wi-Fi
│   └── กำหนดตัวแปร: BSSID
├── ดึงข้อมูลชื่อเครือข่าย Wi-Fi (SSID)
│   └── กำหนดตัวแปร: SSID
├── ดึงข้อมูลระดับความแรงสัญญาณ (RSSI)
│   └── กำหนดตัวแปร: RSSI
├── ประกอบข้อความ URL Scheme:
│   └── rssilogger://wifi?bssid=[BSSID]&ssid=[SSID]&rssi=[RSSI]
├── สั่งเปิด URL สู่แอป RSSI Logger
└── พักการทำงาน 1 วินาที แล้ววนลูปต่อไป
```

---

## ขั้นตอนการบันทึกข้อมูลภาคสนาม (iOS)

1. **เริ่มต้นการทำงาน:**
   - เปิดแอป **คำสั่งลัด (Shortcuts)** และกดรันคำสั่งลัด **Send Rssi Logger App** (หากมีข้อความแจ้งเตือนขออนุญาตเปิดแอป ให้เลือก **"อนุญาตเสมอ"**)
2. **เริ่มรอบการเก็บข้อมูล:**
   - ระบบจะสลับหน้าจอมายังแอป **RSSI Logger** โดยอัตโนมัติ
   - เลือกระบุโหมดการเดินทาง และกดปุ่ม **START TRIP**

> [!TIP]
> **การเปลี่ยนโหมดแบบเรียลไทม์:** สามารถแตะเปลี่ยนโหมดการเดินทาง (Walk, Bike, Moto, Car) ระหว่างทางได้ทันทีโดยไม่ต้องหยุดการบันทึก ระบบจะปรับป้ายกำกับ `user_label_mode` ลงในชุดข้อมูลตามจุดเวลาจริง

> [!IMPORTANT]
> **ข้อกำหนดระหว่างการบันทึกข้อมูล:** จำเป็นต้องเปิดหน้าจอแอปพลิเคชัน RSSI Logger ค้างไว้ตลอดช่วงเวลาบันทึกข้อมูล ไม่ควรสลับไปใช้งานแอปพลิเคชันอื่น เพื่อให้การส่งค่าพารามิเตอร์สัญญาณ Wi-Fi จาก Shortcuts เข้าสู่ตัวแอปเกิดขึ้นอย่างต่อเนื่อง และไม่ถูกระบบจัดการทรัพยากรของ iOS ระงับการทำงาน

3. **สิ้นสุดรอบการเก็บข้อมูล:**
   - กดปุ่ม **STOP TRIP** ภายในแอป RSSI Logger เพื่อประมวลผลและสร้างไฟล์ CSV
   - สลับหน้าต่างไปยังแอปคำสั่งลัด แล้วกดปุ่ม **หยุดทำงาน (Stop)**

---

## ประวัติการปรับปรุงระบบ

- **Persistent Participant ID:** เชื่อมต่อ `flutter_secure_storage` เพื่อบันทึกรหัสผู้ทดสอบลงใน iOS Keychain และ Android Hardware ID (`Settings.Secure.ANDROID_ID`) ป้องกันรหัสสูญหายเมื่อถอนการติดตั้งหรือลงแอปใหม่หลังใบรับรองหมดอายุ
- **Editable USER ID Field:** ปลดล็อคช่อง USER ID บนหน้าแดชบอร์ดให้สามารถตรวจสอบและแก้ไขได้ตลอดเวลา เพื่อความสะดวกในการระบุรหัสเดิม
- **Multi-Sensor Synchronization on iOS:** รองรับการซิงค์ข้อมูลร่วมกันระหว่าง BSSID, SSID, RSSI (dBm), GPS และ 6-DOF IMU ผ่าน Apple Shortcuts
- **Trip Counter Initialization Fix:** ปรับปรุงการรีเซ็ตตัวนับเรคคอร์ดในหน้ารายงานผลให้เริ่มต้นที่ 0 ทุกครั้งที่เปิด Trip ใหม่
- **URL Scheme Handling:** ปรับปรุง Parser รับพารามิเตอร์ของ URL Scheme บน iOS ให้ทำงานแบบ Case-insensitive และตัดช่องว่างส่วนเกินโดยอัตโนมัติ



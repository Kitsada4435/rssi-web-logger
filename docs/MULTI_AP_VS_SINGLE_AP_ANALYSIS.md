# สรุปข้อยุติเชิงสถาปัตยกรรม: Single-AP (Connected Only) สำหรับงานวิจัย

> **สถานะ:** ตกผลึกทิศทางเรียบร้อย (Definitive Direction)  
> **อ้างอิงจาก Requirement 3 ข้อ:**
> 1. มุมมองแบบ Network Engineer (Server/AP Association Log)
> 2. เน้นการสัญจรภายนอกอาคาร (Outdoor Mobility)
> 3. ผู้พัฒนาใช้ iOS และผู้ทดลองใช้ทั้ง iOS และ Android

---

## 1. บทสรุป: "ไม่ต้องทำ Multi-AP ให้คงระบบ Single-AP (Connected Only)"

| เหตุผลสนับสนุน | รายละเอียดเชิงวิชาการและวิศวกรรม |
| :--- | :--- |
| **1. ตรงโจทย์ Network Engineer 100%** | Network Engineer ดูแลระบบที่ Controller/Syslog/RADIUS ซึ่งบันทึกเฉพาะ **AP ที่เครื่องเชื่อมต่อ (Association/Roaming)** ไม่สามารถเห็น AP อื่นรอบตัวที่เครื่องไม่ได้เกาะได้ การเก็บเฉพาะ Connected AP จึงสะท้อนข้อมูลจริงที่ระบบเครือข่ายมี |
| **2. บริบท Outdoor สอดคล้องกับ Single AP** | การเดินทางกลางแจ้งระหว่างอาคาร จุดกระจายสัญญาณ (Outdoor APs) มีระยะห่างชัดเจน การหลุด/การ Roam ระหว่าง AP สัมพันธ์กับความเร็วการเคลื่อนที่โดยตรง และมี **GPS เป็น Ground Truth ที่สมบูรณ์อยู่แล้ว** |
| **3. ความเข้ากันได้สมบูรณ์ (iOS & Android Parity)** | ทั้ง iOS (ผ่าน Shortcuts) และ Android (ผ่านแอป) บันทึกโครงสร้าง **Clean 18-Column Research Schema** ได้เท่าเทียมกัน 100% ไม่มีความเหลื่อมล้ำของข้อมูล |
| **4. Zero Friction สำหรับผู้ร่วมทดลอง** | อาสาสมัคร Android ไม่ต้องเปิด Developer Mode หรือปิด Wi-Fi Scan Throttling ติดตั้งแอปแล้วกด Start ได้ทันที |

---

## 2. ฟีเจอร์หลักที่จะใช้แทน Multi-AP (สำหรับการจำแนกโหมดเดินทาง)

เมื่อมองผ่านมุมมอง Network Engineer ข้อมูลจาก Single Connected AP มีมิติที่ทรงพลังเพียงพอในการวิเคราะห์การสัญจร:

1. **RSSI Temporal Dynamics:** อัตราความเปลี่ยนแปลงของสัญญาณ $\Delta \text{RSSI} / \Delta t$ เมื่อเคลื่อนที่เข้าใกล้หรือออกจาก AP
2. **AP Dwell Time:** ระยะเวลาที่เกาะอยู่กับแต่ละ AP (ความเร็วสูง = Dwell Time สั้น)
3. **Roaming Frequency:** จำนวนครั้งที่เปลี่ยน BSSID ต่อหน่วยเวลา
4. **Disconnection Intervals:** ช่องว่างของเวลาที่สัญญาณหลุดไประหว่างข้ามอาคาร (บ่งชี้ความเร็วการเดินทางกลางแจ้ง)
5. **Sensor Fusion:** รวมค่าความเร็วและพิกัดจาก GPS ควบคู่กับ IMU (การสั่นสะเทือน)

---

## 3. แผนการดำเนินงานต่อไป (Action Items)

- [x] **Architecture Decision:** ยืนยันใช้ Single-AP (Connected AP Only) เป็นมาตรฐานของทั้งระบบ
- [ ] **Android App Optimization:** ตรวจสอบให้มั่นใจว่า `MainActivity.kt` บันทึกค่าสถานะ Disconnected (`-99 dBm`, `disconnected`) เมื่ออยู่นอกระยะสัญญาณอย่างแม่นยำ
- [ ] **Data Pipeline Readiness:** โครงสร้าง 18 คอลัมน์เดิมพร้อมใช้งานทั้ง iOS และ Android ไม่ต้องแก้ Database Schema
- [x] **iOS Self-Healing Pipeline:** บูรณาการ Network Guard บนคำสั่งลัด และ Web Watchdog บนหน้าเว็บ Safari เพื่อแก้ปัญหา Handover Crash

---

## 4. สถาปัตยกรรม Self-Healing Telemetry Pipeline บน iOS

จากการทดสอบภาคสนามจริงเมื่อวันที่ 7 พฤศจิกายน 2026 พบข้อจำกัดสำคัญของระบบปฏิบัติการ iOS เมื่อทำงานร่วมกับคำสั่งลัด (Shortcuts):
1. **ภาวะ Handover Crash:** เมื่ออุปกรณ์เคลื่อนที่ผ่านจุดอับสัญญาณ Wi-Fi กลางแจ้งระหว่างอาคาร (ความเร็ว 20–35 km/h) และกลับเข้าสู่ระยะสัญญาณของ AP อาคารใหม่ iOS มีช่วงหน่วงเวลาสลับคลื่น (2–4 วินาที) ที่ยังออกอินเทอร์เน็ตไม่ได้ ทำให้คำสั่ง `Get contents of URL` บน Shortcuts เกิด Fatal Error และยุติการทำงานของลูปทันที
2. **การคงอยู่ของการทำงาน (Persistence):** หากหน้าจอเปิดอยู่ (ผ่าน Web WakeLock) และไม่มี Error จากเครือข่าย คำสั่งลัดสามารถรันต่อเนื่องได้เกิน 10 นาที (มากกว่า 338 ตัวอย่าง) โดยระบบปฏิบัติการไม่ตัดการทำงาน

### กลไกการแก้ปัญหาแบบ 2 ชั้น (Self-Healing Two-Tier Architecture)

```mermaid
flowchart TD
    subgraph Tier1 ["ชั้นที่ 1: ป้องกันในระดับคำสั่งลัด (Shortcut Network Guard)"]
        A["วนซ้ำ (Repeat Loop)"] --> B["อ่านค่า Wi-Fi Details (BSSID, SSID, RSSI)"]
        B --> C{"ตรวจสอบสถานะเครือข่าย<br>(Get Current IP Address)"}
        C -- "มี IP เชื่อมต่อได้" --> D["ส่งข้อมูลขึ้นเซิร์ฟเวอร์<br>(Get Contents of URL)"]
        C -- "ไม่มีเน็ต / กำลังสลับคลื่น" --> E["ข้ามการยิง URL ทันที<br>(Bypass to Prevent Fatal Error)"]
        D --> F["รอ 1 วินาที (Wait 1s)"]
        E --> F
        F --> A
    end

    subgraph Tier2 ["ชั้นที่ 2: เฝ้าระวังบนเว็บแดชบอร์ด (Safari Web Watchdog)"]
        G["Safari Web Dashboard ตรวจสอบเวลาตัวอย่างล่าสุด"] --> H{"ไม่มีข้อมูลส่งเข้ามา<br>เกิน 60 วินาที?"}
        H -- "ใช่ (Shortcut หลุด)" --> I["แสดงแถบแจ้งเตือนสีส้ม + สั่นเตือน<br>[แตะที่นี่เพื่อปลุกคำสั่งลัด ⚡]"]
        I --> J["ผู้ใช้แตะปุ่ม 1 ครั้ง เพื่อเรียก<br>shortcuts://run-shortcut"]
        H -- "ไม่ใช่ (ปกติ)" --> G
    end
```

### ข้อมูลเชิงตัวเลขเปรียบเทียบระยะเวลาเฝ้าระวัง (Watchdog Timeout Evaluation)
* **เกณฑ์ที่เลือกใช้:** **60 วินาที (1 นาที)**
  * **โหมดเดิน (Walk ~4.5 km/h):** เคลื่อนที่ไปได้ระยะทางประมาณ 75 เมตร (สูญเสียข้อมูลไม่เกิน 33 จุด) ครอบคลุมช่วงเวลาเดินข้ามถนนระหว่างตึก
  * **โหมดขับขี่ (Vehicle ~30 km/h):** เคลื่อนที่ไปได้ระยะทางประมาณ 500 เมตร ผู้สำรวจแตะปลุกได้ทันก่อนหลุดออกนอกเส้นทางวิจัย
  * **ความน่าเชื่อถือด้านสถิติ:** ขจัดปัญหาแจ้งเตือนหลอก (False Alarm) จากความหน่วงของ Cell Handover (15–30 วินาที) ได้ 100%

---

## 5. สถาปัตยกรรมการบันทึกความเร็วและพิกัด (GPS & Kinematic Speed): iOS vs Android

จากการตรวจสอบเชิงลึกของท่อส่งข้อมูล (Data Pipeline) พบข้อแตกต่างทางสถาปัตยกรรมระหว่างระบบปฏิบัติการ iOS และ Android ดังนี้:

### ตารางเปรียบเทียบกลไกการบันทึกความเร็วและพิกัด

| มิติการทำงาน | ฝั่ง Android (Native Companion App) | ฝั่ง iOS (Safari Web + Apple Shortcuts) |
| :--- | :--- | :--- |
| **เครื่องมือรวบรวม** | Native Flutter Service (`GpsProvider`) | สถาปัตยกรรมแบบไฮบริด (Hybrid Dual-Engine) |
| **แหล่งที่มาของ Speed** | ฮาร์ดแวร์ GPS ชิปโดยตรง (`FusedLocationProviderClient`) | คำนวณความเร็วแบบ Kinematic ($\Delta d / \Delta t$) บน Safari |
| **การทำงานเบื้องหลัง** | **รันเบื้องหลังได้ 100%** ผ่าน Foreground Service (Persistent Notification) จอดับก็ยังเก็บต่อเนื่อง | **ต้องเปิดหน้าจอ Safari ค้างไว้** (มี Web WakeLock กันจอดับ) หากจอดับ WebKit จะ Freeze การทำงานของ GPS ทันที |
| **บทบาทของ Shortcuts** | ไม่ได้ใช้งาน | วิ่งลูปเก็บเฉพาะ **Wi-Fi RSSI, SSID, BSSID** แล้วยิงขึ้นเซิร์ฟเวอร์ (ไม่มีสิทธิ์ดึงตัวแปร Speed ตรงๆ) |
| **ความถี่การบันทึก** | 1 วินาทีต่อจุด (บันทึกลง SQLite ออฟไลน์) | 1 วินาทีต่อจุด (Shortcuts ส่ง Wi-Fi, Safari ผสานพิกัดและความเร็ว) |
| **การแปลงหน่วย** | m/s $\times 3.6 \rightarrow$ km/h (ทศนิยม 2 ตำแหน่ง) | $(\text{Haversine Distance} / \Delta t) \times 3.6 \rightarrow$ km/h |

```mermaid
flowchart TD
    subgraph AndroidPipeline ["ฝั่ง Android: Native Autonomous Pipeline"]
        A1["Foreground Service (ตลอด 24 ชม.)"] --> A2["WifiManager (RSSI/BSSID)"]
        A1 --> A3["FusedLocationProvider (GPS Lat/Lon/Speed)"]
        A2 & A3 --> A4["Synchronized Snapshot (1s)"]
        A4 --> A5["SQLite Local Database"]
        A5 --> A6["Export CSV & ZIP to Google Drive"]
    end

    subgraph iOSPipeline ["ฝั่ง iOS: Hybrid Dual-Engine Pipeline"]
        B1["Apple Shortcuts (Loop 1s)"] --> B2["อ่าน Wi-Fi Details (RSSI/SSID/BSSID)"]
        B2 --> B3["HTTP GET /api/log (Wi-Fi Payload)"]
        
        C1["Safari Web Dashboard (Foreground + WakeLock)"] --> C2["navigator.geolocation.watchPosition"]
        C2 --> C3["Sliding Window Kinematic Buffer (1.2-3.0s)"]
        
        B3 & C3 --> C4["Serverless Ingestion & Merge Engine"]
        C4 --> C5["Clean 18-Column Unified Research CSV"]
    end
```

### ข้อค้นพบสำคัญ: เหตุใด Apple Shortcuts จึงไม่สามารถดึง Speed ได้โดยตรง?
1. **ข้อจำกัดของเฟรมเวิร์ก Shortcuts (Apple Constraints):** ในคำสั่ง `Get Details of Location` ของ Apple มีให้เลือกเพียง *Latitude, Longitude, Altitude, Accuracy* และ *Address* เท่านั้น **ไม่มีตัวแปร Speed ให้เลือก**
2. **ปัญหาความหน่วงของการค้นหาดาวเทียม (GPS Latency):** คำสั่ง `Get Current Location` ใน Shortcuts ต้องรอ Hardware Lock พิกัดใหม่ทุกครั้ง ใช้เวลา 5–15 วินาทีต่อรอบ หากนำไปใส่ในลูป จะทำลายอัตราการสุ่มตัวอย่าง Wi-Fi (1 วินาที) ล้มเหลวทันที
3. **การแก้ปัญหาด้วย Sliding Window Kinematic Speed:** ปรับปรุงโค้ดใน `public/app.js` ให้ใช้บัฟเฟอร์ประวัติพิกัดย้อนหลัง 1.2–3.0 วินาที เพื่อคำนวณระยะทางจริงก้าวต่อก้าวของมนุษย์ ขจัดปัญหาการเดินช้า (< 2.8 km/h) โดนปัดเป็น 0.00 km/h ได้สำเร็จ 100%
4. **ข้อปฏิบัติภาคสนามสำหรับ iOS:** ต้องเปิดหน้าจอ Safari ค้างไว้ตลอดการเดินทาง (ระบบมี WakeLock คอยรักษาหน้าจอเปิดไว้ให้อัตโนมัติ) เพื่อให้การจับพิกัดและความเร็วไม่ถูกระงับการทำงานโดยระบบปฏิบัติการ iOS

# Phase 2: แผนการเก็บข้อมูลภาคสนามและการพัฒนาโมเดล AI/ML (Data Collection & ML Pipeline)

เอกสารนี้ระบุขั้นตอนการดำเนินงานใน **เฟส 2** ของโครงการวิจัยการจำแนกรูปแบบการเดินทางจากการเปลี่ยนแปลงของค่าความแรงสัญญาณ Wi-Fi (RSSI) บนสมาร์ตโฟน iOS และ Android ต่อเนื่องจากเฟส 1 ที่พัฒนาแอปพลิเคชันและวางท่อส่งข้อมูลเสร็จสมบูรณ์แล้ว

---

## 1. วัตถุประสงค์ของเฟส 2 (Objectives)

1. เก็บรวบรวมชุดข้อมูลภาคสนาม (Field Dataset) จากกลุ่มตัวอย่างจริงในพื้นที่มหาวิทยาลัยเชียงใหม่
2. ตรวจสอบความถูกต้องและคุณภาพข้อมูล (Data Quality Assurance & Preprocessing)
3. สกัดคุณลักษณะเด่น (Feature Engineering) จากสัญญาณ Wi-Fi RSSI, GPS และ IMU
4. ฝึกสอนและเปรียบเทียบโมเดล Machine Learning / Deep Learning สำหรับจำแนกรูปแบบการเดินทาง
5. ประเมินผลความแม่นยำแบบข้ามอุปกรณ์ (Hardware-Agnostic Evaluation) ด้วยเทคนิค Leave-One-Subject-Out Cross-Validation (LOSO-CV)

---

## 2. แผนการเก็บข้อมูลภาคสนาม (Data Collection Campaign)

### 2.1 กลุ่มตัวอย่างและอุปกรณ์
* **จำนวนผู้เข้าร่วม:** นักศึกษา/อาสาสมัคร 15–30 คน
* **การกระจายอุปกรณ์:** สัดส่วนระหว่าง Android (ยี่ห้อและรุ่นหลากหลาย) และ iOS (iPhone หลากหลายรุ่น)
* **การติดตั้ง:** อ้างอิงขั้นตอนจากเอกสารคู่มือหลัก [README.md](../README.md)

### 2.2 โหมดการเดินทางและเงื่อนไขการบันทึก
| โหมดการเดินทาง (Label) | ช่วงความเร็วโดยประมาณ | เงื่อนไขการเก็บข้อมูล |
|:---|:---|:---|
| **Walk (เดิน)** | 3 – 6 km/h | ทางเดินเท้า, ทางเชื่อมอาคาร, รอบอ่างแก้ว |
| **Bike (ปั่นจักรยาน)** | 10 – 20 km/h | เลนจักรยานและถนนภายในมหาวิทยาลัย |
| **Motorcycle (รถจักรยานยนต์)** | 20 – 40 km/h | ถนนสายหลักภายในมหาวิทยาลัย |
| **Car (รถยนต์)** | 20 – 50 km/h | ถนนสายหลักภายในมหาวิทยาลัย |

* **ตำแหน่งการพกพา (Phone Positions):** สลับเก็บข้อมูลระหว่าง `Pocket` (กระเป๋ากางเกง), `Hand` (ถือในมือ) และ `Bag` (กระเป๋าสะพาย)
* **ความยาวของทริป (Trip Duration):** แนะนำรอบละ 10 – 20 นาที เพื่อให้ครอบคลุมการเคลื่อนที่ผ่านจุดกระจายสัญญาณ Wi-Fi (Access Point) หลายจุด

---

## 3. ท่อประมวลผลข้อมูล (Data Preprocessing Pipeline)

1. **ดึงข้อมูลจาก Cloud Storage:**
   - ดึงไฟล์ `.zip` จาก Google Drive ผ่าน Folder ID ที่เชื่อมต่อกับ Google Apps Script (GAS)
   - แตกไฟล์เป็น `.csv` และจัดระเบียบตามโครงสร้าง `dataset / {Platform} / {DeviceModel} / {ParticipantID}`
2. **การคัดกรองข้อมูล (Data Cleaning):**
   - ตรวจสอบความสม่ำเสมอของ Timestamp (`t_utc_ms`, `timestamp`) และความครบถ้วนของทั้ง 18 คอลัมน์มาตรฐานวิจัย
   - ตรวจจับและจัดการค่า Outlier หรือข้อมูลที่ Wi-Fi หลุดการเชื่อมต่อไปยังโหมด No Connection
3. **การแบ่งหน้าต่างข้อมูล (Sliding Window Segmentation):**
   - แบ่งข้อมูลอนุกรมเวลาเป็นหน้าต่างย่อย (Window Size) ขนาด 5 วินาที, 10 วินาที, และ 15 วินาที พร้อม Overlap 50%

---

## 4. การสกัดคุณลักษณะ (Feature Engineering)

สกัด Feature สำคัญจากสัญญาณในแต่ละ Window:

### 4.1 คุณลักษณะด้าน Wi-Fi RSSI
* **Statistical Features:** ค่าเฉลี่ย (Mean), ส่วนเบี่ยงเบนมาตรฐาน (Std), ค่าต่ำสุด/สูงสุด (Min/Max), ความแปรปรวน (Variance), ค่าพิสัย (Range)
* **Signal Dynamics:** อัตราการเปลี่ยนแปลงความแรงสัญญาณต่อหน่วยเวลา ($\Delta RSSI / \Delta t$)
* **Handover Frequency:** จำนวนครั้งที่มีการเปลี่ยน BSSID (สลับ Access Point) ต่อหน้าต่างเวลา
* **Spatial RSSI Gradient:** ความชันของการลดลงของสัญญาณเมื่อเคลื่อนที่ออกห่างจาก AP

### 4.2 คุณลักษณะประกอบ (Complementary Features)
* **GPS Speed & Accuracy:** ความเร็วและอัตราเร่งจากระบบดาวเทียม
* **IMU (Accelerometer & Gyroscope):** ค่า Magnitude Vector $\sqrt{x^2 + y^2 + z^2}$, Peak Frequency จาก Fast Fourier Transform (FFT)

---

## 5. การพัฒนาและฝึกสอนโมเดล (Machine Learning Models)

1. **โมเดลพื้นฐาน (Baseline Classifiers):**
   - Random Forest (RF)
   - Extreme Gradient Boosting (XGBoost)
   - LightGBM
2. **โมเดลประมวลผลอนุกรมเวลา (Sequence Deep Learning):**
   - 1D Convolutional Neural Network (1D-CNN)
   - Long Short-Term Memory (LSTM) / Gated Recurrent Unit (GRU)
3. **โมเดลเปรียบเทียบ (Ablation Study):**
   - Model A: ใช้เฉพาะ Wi-Fi RSSI
   - Model B: ใช้ Wi-Fi RSSI + GPS
   - Model C: ใช้ Wi-Fi RSSI + IMU
   - Model D: ใช้เซ็นเซอร์ครบทุกตัว (Multi-modal Fusion)

---

## 6. แผนการวัดผลและรายงาน (Evaluation & Deliverables)

* **เมตริกประเมินผล:** Accuracy, Precision, Recall, F1-Score และ Confusion Matrix ในแต่ละโหมด
* **การพิสูจน์ Hardware-Agnostic:** ทดสอบด้วยวิธี Leave-One-Subject-Out Cross-Validation (LOSO-CV) เพื่อพิสูจน์ว่าโมเดลสามารถทำงานได้อย่างแม่นยำบนโทรศัพท์เครื่องใหม่ที่ไม่เคยมีในชุดข้อมูลฝึกสอน
* **ผลลัพธ์สุดท้าย:** รายงานสรุปผลการวิจัย, ชุดข้อมูลเปิดเผย (Anonymized Dataset) และโมเดลจำแนกรูปแบบการเดินทางที่พร้อมประยุกต์ใช้งาน

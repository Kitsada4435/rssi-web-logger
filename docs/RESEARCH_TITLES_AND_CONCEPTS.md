# เอกสารรวบรวมชื่อหัวข้องานวิจัย (Research Title Candidates)

> **หัวข้อหลัก:** การอนุมานรูปแบบการเดินทางจากการเปลี่ยนแปลงความแรงสัญญาณ Wi-Fi (RSSI) ร่วมกับเซ็นเซอร์บนอุปกรณ์เคลื่อนที่  
> **ต่อยอดจากงานวิจัยฐาน:** Jundee, Phithakkitnukoon & Ratti (2023), *Inferring Trips and Origin-Destination Flows From Wi-Fi Probe Data: A Case Study of Campus Wi-Fi Network*, IEEE Access.

---

## 1. ชุดชื่อที่เลือกใช้ (แนวทาง Mode Inference & Temporal RSSI)

### 1.1 ฉบับทางการสำหรับวิทยานิพนธ์ / ปริญญานิพนธ์ (Thesis / Project Report)
* **ภาษาไทย:**  
  การอนุมานรูปแบบการเดินทางจากการเปลี่ยนแปลงความแรงสัญญาณ Wi-Fi เชิงเวลาและการหลอมรวมเซ็นเซอร์บนอุปกรณ์เคลื่อนที่: กรณีศึกษาเครือข่ายภายในมหาวิทยาลัย
* **English:**  
  *Inferring Travel Modes from Temporal Wi-Fi RSSI Variations and Mobile Multi-Sensor Fusion: A Campus Case Study*

### 1.2 ฉบับกระชับสำหรับส่งตีพิมพ์บทความวิชาการ (Journal / Conference Paper)
* **English:**  
  *Inferring Travel Modes from Temporal Wi-Fi RSSI Dynamics on Mobile Devices*
* **ภาษาไทย:**  
  การอนุมานรูปแบบการเดินทางจากพลวัตความแรงสัญญาณ Wi-Fi เชิงเวลาบนอุปกรณ์เคลื่อนที่

### 1.3 ฉบับเน้นโมเดล Machine Learning / Deep Learning
* **English:**  
  *Machine Learning-Based Travel Mode Inference Using Temporal Wi-Fi Signal Variations on Smartphones*
* **ภาษาไทย:**  
  การอนุมานรูปแบบการเดินทางด้วยการเรียนรู้ของเครื่องจากการเปลี่ยนแปลงสัญญาณ Wi-Fi เชิงเวลาบนสมาร์ตโฟน

---

## 2. เหตุผลที่เลือกแนวทาง "Inference" แทน "Detection"

1. **โจทย์เน้นการสังเกตการเปลี่ยนแปลงสัญญาณตลอดเส้นทาง (Trip Sequence):** การใช้คำว่า *Inference* (การอนุมาน) สื่อถึงการวิเคราะห์เชิงเวลา (Temporal Context) และการคาดการณ์สถานะการเดินทางที่ต่อเนื่อง ไม่ใช่แค่การตัดแบ่งคลาสเสี้ยววินาที (Classification snapshot)
2. **การสอดคล้องกับงานวิจัยอ้างอิง:** งานของ Jundee et al. (2023) ใช้กรอบแนวคิด *Inferring Trips and OD Flows* ทำให้ชื่องานวิจัยนี้แสดงถึงการต่อยอดเชิงสายวิชาการได้อย่างชัดเจน
3. **เปิดกว้างสำหรับการใช้ Sensor Fusion:** รองรับการดึงฟีเจอร์จาก Wi-Fi RSSI ร่วมกับ IMU (Accelerometer, Gyroscope) โดยมี GPS เป็น Ground Truth

---

## 3. คำสำคัญสำหรับสืบค้น (Academic Keywords)

* **ภาษาอังกฤษ:**
  * Travel Mode Inference
  * Wi-Fi RSSI Dynamics
  * Temporal RSSI Variations
  * Multi-Sensor Fusion
  * Campus Mobility
  * Machine Learning
  * Mobile Sensing
* **ภาษาไทย:**
  * การอนุมานรูปแบบการเดินทาง
  * พลวัตความแรงสัญญาณ Wi-Fi
  * การหลอมรวมข้อมูลหลายเซ็นเซอร์
  * การสัญจรภายในมหาวิทยาลัย
  * การเรียนรู้ของเครื่อง

---

## 4. ตารางเปรียบเทียบคำศัพท์เชิงเทคนิค

| แนวคิด | คำศัพท์ที่ใช้ | ความหมายเชิงเทคนิค |
| :--- | :--- | :--- |
| **เป้าหมาย** | Inference (การอนุมาน) | วิเคราะห์จากหลักฐานทางอ้อม (Indirect signals) และความน่าจะเป็นของลำดับเหตุการณ์ |
| **ตัวแปรต้นหลัก** | Temporal Wi-Fi RSSI Dynamics | ความแรงสัญญาณ Wi-Fi ที่เปลี่ยนแปลงตามเวลาและตำแหน่งที่เคลื่อนที่ผ่าน Access Points |
| **ตัวแปรเสริม** | Multi-Sensor Fusion | การผสานค่าความเร่ง/ความเร็วเชิงมุมจาก IMU ร่วมกับข้อมูลเวลาและเครือข่าย |
| **ตัวแปรอ้างอิง** | GPS Ground Truth | ข้อมูลพิกัดและความเร็วจากดาวเทียมที่ใช้เป็นค่าอ้างอิงความถูกต้องสำหรับโมเดล |

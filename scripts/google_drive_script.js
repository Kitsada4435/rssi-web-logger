/**
 * Google Apps Script for RSSI Web Logger
 * บันทึกข้อมูล Wi-Fi RSSI + GPS อัตโนมัติลง Google Sheets และสร้างไฟล์ CSV ใน Google Drive
 * 
 * วิธีติดตั้ง (ทำเพียงครั้งเดียว 2 นาที):
 * 1. เปิด https://script.google.com แล้วกด "New project"
 * 2. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 3. ตั้งชื่อโปรเจกต์ เช่น "RSSI Web Logger Sync"
 * 4. กดปุ่ม "Deploy" (การทำให้ใช้งานได้) > "New deployment" (การทำให้ใช้งานได้ใหม่)
 * 5. เลือกประเภท (Gear icon) -> "Web app" (เว็บแอป)
 * 6. ตั้งค่า:
 *    - Description: RSSI Web Logger Webhook
 *    - Execute as: Me (ฉัน - บัญชี Google ของคุณ)
 *    - Who has access: Anyone (ทุกคน)  <-- สำคัญมาก! เพื่อให้หน้าเว็บส่งข้อมูลเข้าได้
 * 7. กด "Deploy" แล้วคัดลอก "Web app URL" (ขึ้นต้นด้วย https://script.google.com/macros/s/...)
 * 8. นำ URL ไปใส่ในช่อง "Google Drive Webhook URL" บนหน้าเว็บ RSSI Web Logger
 */

const FOLDER_NAME = "RSSI_Web_Logger_Trips";
const SHEET_NAME = "RSSI_Web_Logger_Master";

function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);

    // 1. ตรวจสอบหรือสร้างโฟลเดอร์ใน Google Drive
    let folder = getOrCreateFolder(FOLDER_NAME);

    // 2. ตรวจสอบหรือสร้าง Google Sheet กลาง
    let sheet = getOrCreateSpreadsheet(folder, SHEET_NAME);

    let rowsAdded = 0;
    let savedCsvUrl = null;

    // กรณีเป็น Batch Upload (ทั้งทริปจากปุ่ม Sync To Google Drive)
    if (data.action === "batch_upload" && Array.isArray(data.logs)) {
      const logs = data.logs;
      const sheetData = [];

      logs.forEach(row => {
        const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
        sheetData.push([
          tUtc,
          row.t_mono_ns || "",
          row.timestamp || new Date(tUtc).toISOString(),
          row.session_id || row.trip_id || "TRIP",
          row.participant_id || "ANON",
          row.platform || "ios",
          row.device_model || (row.platform === "android" ? "Android Device" : "Apple iPhone"),
          row.os_version || (row.platform === "android" ? "Android" : "iOS 18.1"),
          row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ""),
          row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ""),
          row.speed !== null && row.speed !== undefined ? row.speed : "",
          row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
          row.accel_x !== null && row.accel_x !== undefined ? row.accel_x : "",
          row.accel_y !== null && row.accel_y !== undefined ? row.accel_y : "",
          row.accel_z !== null && row.accel_z !== undefined ? row.accel_z : "",
          row.gyro_x !== null && row.gyro_x !== undefined ? row.gyro_x : "",
          row.gyro_y !== null && row.gyro_y !== undefined ? row.gyro_y : "",
          row.gyro_z !== null && row.gyro_z !== undefined ? row.gyro_z : "",
          row.bssid || "",
          row.ssid || "",
          row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ""),
          row.rssi_source || (row.platform === "android" ? "wifimanager" : "shortcut"),
          row.user_label_mode || "walk",
          row.activity_recognition_mode || row.predicted_mode || "still",
          row.phone_position || "pocket",
          row.note || ""
        ]);
      });

      if (sheetData.length > 0) {
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, sheetData.length, 26).setValues(sheetData);
        rowsAdded = sheetData.length;
      }

      // บันทึกไฟล์ CSV สำรองเข้าโฟลเดอร์ Google Drive สำหรับทริปนี้
      if (data.save_csv !== false && logs.length > 0) {
        const tripId = data.trip_id || `TRIP_${Date.now()}`;
        const participantId = data.participant_id || "ANON";
        const csvContent = generateCsvString(logs);
        const fileName = `${participantId}_${tripId}_${Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss")}.csv`;
        const file = folder.createFile(fileName, csvContent, MimeType.CSV);
        savedCsvUrl = file.getUrl();
      }

    } else {
      // กรณีส่งทีละจุด Real-time จาก API / Shortcuts / Android
      const tUtc = data.t_utc_ms || (data.timestamp ? Date.parse(data.timestamp) : Date.now());
      const row = [
        tUtc,
        data.t_mono_ns || "",
        data.timestamp || new Date(tUtc).toISOString(),
        data.session_id || data.trip_id || "TRIP",
        data.participant_id || "ANON",
        data.platform || "ios",
        data.device_model || (data.platform === "android" ? "Android Device" : "Apple iPhone"),
        data.os_version || (data.platform === "android" ? "Android" : "iOS 18.1"),
        data.lat !== null && data.lat !== undefined ? data.lat : (data.latitude !== null && data.latitude !== undefined ? data.latitude : ""),
        data.lon !== null && data.lon !== undefined ? data.lon : (data.longitude !== null && data.longitude !== undefined ? data.longitude : ""),
        data.speed || 0,
        data.accuracy || 5,
        data.accel_x !== null && data.accel_x !== undefined ? data.accel_x : "",
        data.accel_y !== null && data.accel_y !== undefined ? data.accel_y : "",
        data.accel_z !== null && data.accel_z !== undefined ? data.accel_z : "",
        data.gyro_x !== null && data.gyro_x !== undefined ? data.gyro_x : "",
        data.gyro_y !== null && data.gyro_y !== undefined ? data.gyro_y : "",
        data.gyro_z !== null && data.gyro_z !== undefined ? data.gyro_z : "",
        data.bssid || "",
        data.ssid || "",
        data.rssi_raw !== null && data.rssi_raw !== undefined ? data.rssi_raw : (data.rssi !== null && data.rssi !== undefined ? data.rssi : -99),
        data.rssi_source || (data.platform === "android" ? "wifimanager" : "shortcut"),
        data.user_label_mode || data.mode || "walk",
        data.activity_recognition_mode || data.predicted_mode || "still",
        data.phone_position || "pocket",
        data.note || ""
      ];
      sheet.appendRow(row);
      rowsAdded = 1;
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      rows_added: rowsAdded,
      sheet_url: sheet.getParent().getUrl(),
      csv_file_url: savedCsvUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "RSSI Web Logger Google Drive Endpoint is Active",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper: ดึงหรือสร้างโฟลเดอร์ Google Drive
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

// Helper: ดึงหรือสร้าง Google Spreadsheet พร้อมหัวตาราง
function getOrCreateSpreadsheet(folder, sheetName) {
  const files = folder.getFilesByName(sheetName);
  let ss;
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(sheetName);
    const ssFile = DriveApp.getFileById(ss.getId());
    folder.addFile(ssFile);
    DriveApp.getRootFolder().removeFile(ssFile);

    // สร้าง Header แถวแรก (Unified 26 Core Research Schema)
    const ws = ss.getActiveSheet();
    ws.appendRow([
      "t_utc_ms",
      "t_mono_ns",
      "timestamp",
      "session_id",
      "participant_id",
      "platform",
      "device_model",
      "os_version",
      "lat",
      "lon",
      "speed",
      "accuracy",
      "accel_x",
      "accel_y",
      "accel_z",
      "gyro_x",
      "gyro_y",
      "gyro_z",
      "bssid",
      "ssid",
      "rssi_raw",
      "rssi_source",
      "user_label_mode",
      "activity_recognition_mode",
      "phone_position",
      "note"
    ]);
    ws.getRange("A1:Z1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    ws.setFrozenRows(1);
  }
  return ss.getActiveSheet();
}

// Helper: แปลงข้อมูลเป็น CSV Text
function generateCsvString(logs) {
  const headers = [
    "t_utc_ms",
    "t_mono_ns",
    "timestamp",
    "session_id",
    "participant_id",
    "platform",
    "device_model",
    "os_version",
    "lat",
    "lon",
    "speed",
    "accuracy",
    "accel_x",
    "accel_y",
    "accel_z",
    "gyro_x",
    "gyro_y",
    "gyro_z",
    "bssid",
    "ssid",
    "rssi_raw",
    "rssi_source",
    "user_label_mode",
    "activity_recognition_mode",
    "phone_position",
    "note"
  ];
  let csv = headers.join(",") + "\n";
  logs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    const line = [
      tUtc,
      row.t_mono_ns || "",
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || "TRIP",
      row.participant_id || "ANON",
      row.platform || "ios",
      `"${(row.device_model || (row.platform === "android" ? "Android Device" : "Apple iPhone")).replace(/"/g, '""')}"`,
      `"${(row.os_version || (row.platform === "android" ? "Android" : "iOS 18.1")).replace(/"/g, '""')}"`,
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ""),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ""),
      row.speed !== null && row.speed !== undefined ? row.speed : "",
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
      row.accel_x !== null && row.accel_x !== undefined ? row.accel_x : "",
      row.accel_y !== null && row.accel_y !== undefined ? row.accel_y : "",
      row.accel_z !== null && row.accel_z !== undefined ? row.accel_z : "",
      row.gyro_x !== null && row.gyro_x !== undefined ? row.gyro_x : "",
      row.gyro_y !== null && row.gyro_y !== undefined ? row.gyro_y : "",
      row.gyro_z !== null && row.gyro_z !== undefined ? row.gyro_z : "",
      row.bssid || "",
      `"${(row.ssid || "").replace(/"/g, '""')}"`,
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ""),
      row.rssi_source || (row.platform === "android" ? "wifimanager" : "shortcut"),
      row.user_label_mode || "walk",
      row.activity_recognition_mode || row.predicted_mode || "still",
      row.phone_position || "pocket",
      `"${(row.note || "").replace(/"/g, '""')}"`
    ];
    csv += line.join(",") + "\n";
  });
  return csv;
}


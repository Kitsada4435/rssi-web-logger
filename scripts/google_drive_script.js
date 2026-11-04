/**
 * Google Apps Script for RSSI Web Logger & Mobile App
 * รองรับทั้งการอัปโหลดไฟล์ ZIP/CSV แบบจัดโครงสร้างโฟลเดอร์อัตโนมัติ (dataset -> OS -> Model -> User)
 * และบันทึกลง Google Sheets กลาง (Clean 18-Column Unified Research Schema)
 * 
 * วิธีติดตั้งใน Google Apps Script (script.google.com):
 * 1. วางโค้ดนี้ทับใน Code.gs
 * 2. กดปุ่ม Deploy > Manage deployments > กดรูปดินสอแก้ไข > เลือก Version: New version > กด Deploy
 */

// โฟลเดอร์หลักใน Google Drive (RSSI_Database)
const PARENT_FOLDER_ID = "1DtbWXEuofNvZINSBrmXzn5CnXdzPzjFQ"; 
const SHEET_NAME = "RSSI_Web_Logger_Master";

function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);

    // 1. ตรวจสอบโฟลเดอร์หลัก (Root / Parent Folder)
    let parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } catch (err) {
      parentFolder = getOrCreateFolder(DriveApp.getRootFolder(), "RSSI_Database");
    }

    let savedFileUrl = null;
    let rowsAdded = 0;

    // 2. กรณีที่ 1: อัปโหลดไฟล์โดยตรง (Base64 ZIP จาก Android App หรือ Base64 CSV)
    if (data.content && data.filename) {
      const filename = data.filename;
      const base64Content = data.content;
      const os = data.os || "android";
      const deviceModel = data.deviceModel || "UnknownDevice";
      const participantId = data.participantId || "UnknownUser";

      const decoded = Utilities.base64Decode(base64Content);
      const isZip = filename.toLowerCase().endsWith(".zip");
      const mime = isZip ? "application/zip" : "text/csv";
      const blob = Utilities.newBlob(decoded, mime, filename);

      // สร้างโครงสร้างโฟลเดอร์อัตโนมัติ (dataset -> OS -> Model -> User)
      const datasetFolder = getOrCreateFolder(parentFolder, "dataset");
      const osFolder = getOrCreateFolder(datasetFolder, os);
      const deviceFolder = getOrCreateFolder(osFolder, deviceModel);
      const userFolder = getOrCreateFolder(deviceFolder, participantId);

      // เซฟไฟล์ลงโฟลเดอร์ของ User
      const file = userFolder.createFile(blob);
      savedFileUrl = file.getUrl();

      // หากมี data.logs แนบมาด้วย ให้บันทึกลง Google Sheets ต่อเนื่องทันที
      if (data.action === "batch_upload" && Array.isArray(data.logs)) {
        rowsAdded = appendBatchLogsToSheet(parentFolder, data.logs);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        file_url: savedFileUrl,
        filename: filename,
        rows_added: rowsAdded
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. กรณีที่ 2: Batch Upload จากหน้า Web Dashboard (ส่ง Array ของ Logs 18 คอลัมน์)
    if (data.action === "batch_upload" && Array.isArray(data.logs)) {
      const logs = data.logs;
      rowsAdded = appendBatchLogsToSheet(parentFolder, logs);

      // บันทึกไฟล์ CSV สำรองเข้าโฟลเดอร์ Google Drive
      if (data.save_csv !== false && logs.length > 0) {
        const tripId = data.trip_id || `TRIP_${Date.now()}`;
        const participantId = data.participant_id || "ANON";
        const os = data.os || (logs[0] && logs[0].platform) || "ios";
        const deviceModel = data.device_model || (logs[0] && logs[0].device_model) || "iPhone";

        const csvContent = generateCsvString(logs);
        const fileName = `${participantId}_${tripId}_${Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss")}.csv`;

        const datasetFolder = getOrCreateFolder(parentFolder, "dataset");
        const osFolder = getOrCreateFolder(datasetFolder, os);
        const deviceFolder = getOrCreateFolder(osFolder, deviceModel);
        const userFolder = getOrCreateFolder(deviceFolder, participantId);

        const file = userFolder.createFile(fileName, csvContent, MimeType.CSV);
        savedFileUrl = file.getUrl();
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        rows_added: rowsAdded,
        csv_file_url: savedFileUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. กรณีที่ 3: รับข้อมูลจุดเดี่ยว Real-time จาก Webhook / Shortcuts
    const sheet = getOrCreateSpreadsheet(parentFolder, SHEET_NAME);
    const tUtc = data.t_utc_ms || (data.timestamp ? Date.parse(data.timestamp) : Date.now());
    let spd = data.speed !== null && data.speed !== undefined && data.speed !== "" ? data.speed : 0;
    if (typeof spd === "number") spd = spd.toFixed(2);

    const row = [
      tUtc,
      data.timestamp || new Date(tUtc).toISOString(),
      data.session_id || data.trip_id || "TRIP",
      data.participant_id || "ANON",
      data.platform || "ios",
      data.device_model || (data.platform === "android" ? "Android Device" : "Apple iPhone"),
      data.os_version || (data.platform === "android" ? "Android" : "iOS 18.1"),
      data.lat !== null && data.lat !== undefined ? data.lat : (data.latitude !== null && data.latitude !== undefined ? data.latitude : ""),
      data.lon !== null && data.lon !== undefined ? data.lon : (data.longitude !== null && data.longitude !== undefined ? data.longitude : ""),
      spd,
      data.accuracy || 5,
      data.bssid || "",
      data.ssid || "",
      data.rssi_raw !== null && data.rssi_raw !== undefined ? data.rssi_raw : (data.rssi !== null && data.rssi !== undefined ? data.rssi : -99),
      data.rssi_source || (data.platform === "android" ? "wifimanager" : "shortcut"),
      data.user_label_mode || data.mode || "walk",
      data.phone_position || "pocket",
      data.note || ""
    ];
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      rows_added: 1
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
    parent_folder_id: PARENT_FOLDER_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper: ดึงหรือสร้างโฟลเดอร์ย่อยใน Parent Folder
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

// Helper: บันทึกข้อมูลแบบ Batch ลงใน Google Sheets
function appendBatchLogsToSheet(parentFolder, logs) {
  const sheet = getOrCreateSpreadsheet(parentFolder, SHEET_NAME);
  const sheetData = [];

  logs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    let spd = row.speed !== null && row.speed !== undefined && row.speed !== "" ? row.speed : "";
    if (typeof spd === "number") spd = spd.toFixed(2);
    sheetData.push([
      tUtc,
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || "TRIP",
      row.participant_id || "ANON",
      row.platform || "ios",
      row.device_model || (row.platform === "android" ? "Android Device" : "Apple iPhone"),
      row.os_version || (row.platform === "android" ? "Android" : "iOS 18.1"),
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ""),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ""),
      spd,
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
      row.bssid || "",
      row.ssid || "",
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ""),
      row.rssi_source || (row.platform === "android" ? "wifimanager" : "shortcut"),
      row.user_label_mode || "walk",
      row.phone_position || "pocket",
      row.note || ""
    ]);
  });

  if (sheetData.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, sheetData.length, 18).setValues(sheetData);
    return sheetData.length;
  }
  return 0;
}

// Helper: ดึงหรือสร้าง Google Spreadsheet พร้อมหัวตาราง 18 คอลัมน์
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

    const ws = ss.getActiveSheet();
    ws.appendRow([
      "t_utc_ms",
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
      "bssid",
      "ssid",
      "rssi_raw",
      "rssi_source",
      "user_label_mode",
      "phone_position",
      "note"
    ]);
    ws.getRange("A1:R1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    ws.setFrozenRows(1);
  }
  return ss.getActiveSheet();
}

// Helper: แปลงข้อมูลเป็น CSV Text ตาม 18 คอลัมน์มาตรฐาน
function generateCsvString(logs) {
  const headers = [
    "t_utc_ms",
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
    "bssid",
    "ssid",
    "rssi_raw",
    "rssi_source",
    "user_label_mode",
    "phone_position",
    "note"
  ];
  let csv = headers.join(",") + "\n";
  logs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    let spd = row.speed !== null && row.speed !== undefined && row.speed !== "" ? row.speed : "";
    if (typeof spd === "number") spd = spd.toFixed(2);
    const line = [
      tUtc,
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || "TRIP",
      row.participant_id || "ANON",
      row.platform || "ios",
      `"${(row.device_model || (row.platform === "android" ? "Android Device" : "Apple iPhone")).replace(/"/g, '""')}"`,
      `"${(row.os_version || (row.platform === "android" ? "Android" : "iOS 18.1")).replace(/"/g, '""')}"`,
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ""),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ""),
      spd,
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
      row.bssid || "",
      `"${(row.ssid || "").replace(/"/g, '""')}"`,
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ""),
      row.rssi_source || (row.platform === "android" ? "wifimanager" : "shortcut"),
      row.user_label_mode || "walk",
      row.phone_position || "pocket",
      `"${(row.note || "").replace(/"/g, '""')}"`
    ];
    csv += line.join(",") + "\n";
  });
  return csv;
}

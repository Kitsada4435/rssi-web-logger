/**
 * Google Apps Script for RSSI Web Logger & Mobile App (Pure DriveApp Edition)
 * บันทึกไฟล์ CSV / ZIP เข้าโครงสร้างโฟลเดอร์ Google Drive อัตโนมัติ (dataset -> OS -> Model -> User)
 * ใช้สิทธิ์ DriveApp 100% (ไม่ติดสิทธิ์ SpreadsheetApp หรือปัญหาความปลอดภัย)
 * 
 * วิธีติดตั้งใน Google Apps Script (script.google.com):
 * 1. วางโค้ดนี้ทับใน Code.gs
 * 2. กดปุ่ม Deploy > Manage deployments > กดรูปดินสอแก้ไข > เลือก Version: New version > กด Deploy
 */

// โฟลเดอร์หลักใน Google Drive (RSSI_Database)
const PARENT_FOLDER_ID = "1DtbWXEuofNvZINSBrmXzn5CnXdzPzjFQ"; 

function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);

    // 1. ดึงโฟลเดอร์หลัก (Root / Parent Folder)
    let parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } catch (err) {
      parentFolder = getOrCreateFolder(DriveApp.getRootFolder(), "RSSI_Database");
    }

    let savedFileUrl = null;

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

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        file_url: savedFileUrl,
        filename: filename
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. กรณีที่ 2: Batch Upload จากหน้า Web Dashboard (ส่ง Array ของ Logs 18 คอลัมน์)
    if (data.action === "batch_upload" && Array.isArray(data.logs)) {
      const logs = data.logs;

      if (logs.length > 0) {
        const tripId = data.trip_id || `TRIP_${Date.now()}`;
        const participantId = data.participant_id || "ANON";
        const os = data.os || (logs[0] && logs[0].platform) || "ios";
        const deviceModel = data.device_model || (logs[0] && logs[0].device_model) || "iPhone";

        const csvContent = generateCsvString(logs);
        const fileName = `${participantId}_${tripId}_${Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss")}.csv`;

        // สร้างโครงสร้างโฟลเดอร์อัตโนมัติ (dataset -> OS -> Model -> User)
        const datasetFolder = getOrCreateFolder(parentFolder, "dataset");
        const osFolder = getOrCreateFolder(datasetFolder, os);
        const deviceFolder = getOrCreateFolder(osFolder, deviceModel);
        const userFolder = getOrCreateFolder(deviceFolder, participantId);

        // เซฟไฟล์ CSV 18 คอลัมน์ลง Google Drive
        const file = userFolder.createFile(fileName, csvContent, MimeType.CSV);
        savedFileUrl = file.getUrl();
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        csv_file_url: savedFileUrl,
        count: logs.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีอื่นๆ (สถานะตอบรับปกติ)
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Received"
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

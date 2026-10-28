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
        sheetData.push([
          row.timestamp || new Date().toISOString(),
          row.participant_id || "ANON",
          row.trip_id || "TRIP",
          row.latitude !== null && row.latitude !== undefined ? row.latitude : "",
          row.longitude !== null && row.longitude !== undefined ? row.longitude : "",
          row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
          row.speed !== null && row.speed !== undefined ? row.speed : "",
          row.ssid || "",
          row.bssid || "",
          row.rssi !== null && row.rssi !== undefined ? row.rssi : "",
          row.user_label_mode || "walk"
        ]);
      });

      if (sheetData.length > 0) {
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, sheetData.length, 11).setValues(sheetData);
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
      const row = [
        data.timestamp || new Date().toISOString(),
        data.participant_id || "ANON",
        data.trip_id || "TRIP",
        data.latitude !== null && data.latitude !== undefined ? data.latitude : (data.lat || ""),
        data.longitude !== null && data.longitude !== undefined ? data.longitude : (data.lng || ""),
        data.accuracy || 5,
        data.speed || 0,
        data.ssid || "",
        data.bssid || "",
        data.rssi !== null && data.rssi !== undefined ? data.rssi : -99,
        data.user_label_mode || data.mode || "walk"
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

    // สร้าง Header แถวแรก
    const ws = ss.getActiveSheet();
    ws.appendRow([
      "timestamp",
      "participant_id",
      "trip_id",
      "latitude",
      "longitude",
      "accuracy",
      "speed",
      "ssid",
      "bssid",
      "rssi",
      "user_label_mode"
    ]);
    ws.getRange("A1:K1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    ws.setFrozenRows(1);
  }
  return ss.getActiveSheet();
}

// Helper: แปลงข้อมูลเป็น CSV Text
function generateCsvString(logs) {
  const headers = ["timestamp","participant_id","trip_id","latitude","longitude","accuracy","speed","ssid","bssid","rssi","user_label_mode"];
  let csv = headers.join(",") + "\n";
  logs.forEach(row => {
    const line = [
      row.timestamp || "",
      row.participant_id || "",
      row.trip_id || "",
      row.latitude !== null && row.latitude !== undefined ? row.latitude : "",
      row.longitude !== null && row.longitude !== undefined ? row.longitude : "",
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : "",
      row.speed !== null && row.speed !== undefined ? row.speed : "",
      `"${(row.ssid || "").replace(/"/g, '""')}"`,
      row.bssid || "",
      row.rssi !== null && row.rssi !== undefined ? row.rssi : "",
      row.user_label_mode || ""
    ];
    csv += line.join(",") + "\n";
  });
  return csv;
}

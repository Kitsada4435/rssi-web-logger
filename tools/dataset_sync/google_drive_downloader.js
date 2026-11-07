/**
 * Standalone Google Apps Script: RSSI Dataset Downloader & Reader
 * สคริปต์แยกเฉพาะสำหรับ "อ่านและดาวน์โหลดข้อมูล" ลง Laptop เพื่อการวิจัย
 * (แยกโปรเจกต์เด็ดขาด ปลอดภัย 100% ไม่กระทบระบบ Ingestion เดิม)
 * 
 * วิธีติดตั้ง:
 * 1. ไปที่ script.google.com > New project ตั้งชื่อ "RSSI_Downloader"
 * 2. วางโค้ดนี้ลงใน Code.gs
 * 3. กด Deploy > New deployment > เลือก Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. นำ Web App URL ที่ได้ไปใช้งานใน laptop
 */

const PARENT_FOLDER_ID = "1DtbWXEuofNvZINSBrmXzn5CnXdzPzjFQ";

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "status";

  // 1. เรียกดูรายการไฟล์ทั้งหมด (Metadata & Tree)
  if (action === "list_files") {
    try {
      const rootFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
      const filesList = [];
      scanFolderRecursive(rootFolder, "", filesList);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        parent_folder_id: PARENT_FOLDER_ID,
        count: filesList.length,
        files: filesList
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. ดึงข้อมูลเนื้อหาไฟล์เดี่ยวเป็น Base64
  if (action === "download_file") {
    const fileId = e.parameter.file_id;
    if (!fileId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "file_id is required"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    try {
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        mime_type: file.getMimeType(),
        content_base64: Utilities.base64Encode(blob.getBytes())
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // สถานะเริ่มต้น
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "RSSI Dataset Downloader Service",
    parent_folder_id: PARENT_FOLDER_ID
  })).setMimeType(ContentService.MimeType.JSON);
}

// สแกนไฟล์และโฟลเดอร์ย่อยแบบ Recursive
function scanFolderRecursive(folder, parentPath, result) {
  const currentPath = parentPath ? (parentPath + "/" + folder.getName()) : folder.getName();
  
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    result.push({
      id: f.getId(),
      name: f.getName(),
      relative_path: currentPath + "/" + f.getName(),
      size: f.getSize(),
      mime_type: f.getMimeType(),
      created_at: f.getDateCreated().toISOString(),
      updated_at: f.getLastUpdated().toISOString()
    });
  }

  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    scanFolderRecursive(subfolders.next(), currentPath, result);
  }
}


import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:archive/archive_io.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CloudManager {
  // ใส่ URL ที่ได้จาก Google Apps Script (Web App URL)
  static const String defaultGasUrl = "https://script.google.com/macros/s/AKfycbzA44XbzKTShHeT_tA2quQwacEe2OtxH4-cUWAWcd77DvzA3sToagZPNUTegqPOd9aJ/exec";

  static Future<String> getGasUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('custom_gas_url') ?? defaultGasUrl;
  }

  static Future<void> saveGasUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    final trimmed = url.trim();
    if (trimmed.isEmpty || trimmed == defaultGasUrl) {
      await prefs.remove('custom_gas_url');
    } else {
      await prefs.setString('custom_gas_url', trimmed);
    }
  }

  static Future<bool> testConnection(String url) async {
    try {
      final response = await http.get(Uri.parse(url.trim())).timeout(const Duration(seconds: 8));
      return response.statusCode >= 200 && response.statusCode < 400;
    } catch (_) {
      return false;
    }
  }

  /// รับไฟล์ CSV มาบีบอัดเป็น ZIP และอัปโหลดขึ้น Google Drive
  static Future<bool> zipAndUpload({
    required File csvFile,
  }) async {
    try {
      if (!await csvFile.exists()) {
        debugPrint('CloudManager: ไม่พบไฟล์ CSV ที่ต้องการอัปโหลด');
        return false;
      }

      // อ่านบรรทัดที่ 2 (ข้อมูลแถวแรก) เพื่อดึง OS, Model, ParticipantID
      String os = 'unknown_os';
      String deviceModel = 'unknown_model';
      String participantId = 'unknown_user';
      
      final lines = await csvFile.readAsLines();
      if (lines.length > 1) {
        final row = lines[1].split(',');
        if (row.length >= 6) {
          participantId = row[3].replaceAll('"', '');
          os = row[4].replaceAll('"', '');
          deviceModel = row[5].replaceAll('"', '');
        }
      }

      // 1. อ่านไฟล์ CSV ขึ้นมาบน RAM
      List<int> csvBytes = await csvFile.readAsBytes();
      final fileName = p.basename(csvFile.path); // ชื่อไฟล์ .csv เดี่ยวๆ
      final zipFileName = '$fileName.zip';

      // 2. สร้างโครงสร้าง Zip ใน RAM โดยตรง (ไม่ต้องเขียนลงดิสก์)
      Archive archive = Archive();
      ArchiveFile archiveFile = ArchiveFile(fileName, csvBytes.length, csvBytes);
      archive.addFile(archiveFile);
      
      // 3. เข้ารหัสเป็น Zip 
      ZipEncoder encoder = ZipEncoder();
      List<int> zipBytes = encoder.encode(archive);
      if (zipBytes.isEmpty) {
        debugPrint('CloudManager: บีบอัด Zip ล้มเหลว (zipBytes is empty)');
        return false;
      }

      // 4. แปลงเป็น Base64 เพื่อเตรียมส่ง
      String base64Zip = base64Encode(zipBytes);

      // 5. เตรียมข้อมูล (Payload)
      Map<String, dynamic> payload = {
        "filename": zipFileName, // ใช้ชื่อที่มี .zip
        "content": base64Zip,
        "os": os,
        "deviceModel": deviceModel,
        "participantId": participantId
      };

      // 4. ส่ง HTTP POST ไปที่ Google Apps Script
      final targetUrl = await getGasUrl();
      debugPrint('CloudManager: กำลังอัปโหลด $zipFileName ไปที่ $targetUrl ...');
      final response = await http.post(
        Uri.parse(targetUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(payload),
      );

      debugPrint('CloudManager: ได้รับ Response Code: ${response.statusCode}');
      debugPrint('CloudManager: ได้รับ Response Body: ${response.body}');

      // 5. ตรวจสอบผลลัพธ์
      // GAS อาจคืนค่า 200 หรือ 302 และบางครั้ง body อาจเป็น HTML (เนื่องจากการทำ Redirect)
      if (response.statusCode == 200 || response.statusCode == 302) {
        bool isSuccess = false;
        
        try {
          final result = jsonDecode(response.body);
          if (result['status'] == 'success') {
            isSuccess = true;
          } else {
            debugPrint('CloudManager: สคริปต์แจ้ง Error: ${result['message']}');
          }
        } catch (e) {
          // หากแปลง JSON ไม่ได้ (เป็น HTML) แต่ HTTP ผ่าน ถือว่าสคริปต์ทำงานเสร็จแล้ว (เพราะไฟล์ขึ้น Drive แล้ว)
          debugPrint('CloudManager: แจ้งเตือน แปลง JSON ไม่ได้ แต่ HTTP สำเร็จ ถือว่าผ่าน');
          isSuccess = true;
        }

        if (isSuccess) {
          debugPrint('CloudManager: อัปโหลดสำเร็จ! (Google Drive)');
          return true;
        } else {
          return false;
        }
      } else {
        debugPrint('CloudManager: อัปโหลดล้มเหลว (HTTP ${response.statusCode})');
        return false;
      }
    } catch (e) {
      debugPrint('CloudManager: เกิดข้อผิดพลาด Exception - $e');
      return false;
    }
  }
}

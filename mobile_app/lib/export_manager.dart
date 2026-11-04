import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'database.dart';
import 'package:path/path.dart' as p;

class ExportManager {
  final AppDatabase db;
  
  ExportManager(this.db);

  Future<String> exportToCsv(String sessionId) async {
    // 1. ดึงข้อมูลของ Session นี้จาก SQLite
    final events = await db.getEventsBySession(sessionId);
    if (events.isEmpty) return 'ไม่มีข้อมูลใน Session นี้';

    // ดึง Note ประจำ Session จาก SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final sessionNote = prefs.getString('session_note_$sessionId') ?? '';

    // 2. เตรียม Header ของ CSV (Clean 18-Column Unified Research Schema)
    List<List<dynamic>> rows = [];
    rows.add([
      't_utc_ms',
      'timestamp',
      'session_id',
      'participant_id',
      'platform',
      'device_model',
      'os_version',
      'lat',
      'lon',
      'speed',
      'accuracy',
      'bssid',
      'ssid',
      'rssi_raw',
      'rssi_source',
      'user_label_mode',
      'phone_position',
      'note'
    ]);

    // 3. ใส่ข้อมูลทีละแถว พร้อม Forward-fill ค่าล่าสุดเพื่อไม่ให้เกิดช่องว่าง (Zero Blanks)
    dynamic lastLat, lastLon, lastSpeed, lastAccuracy;
    dynamic lastBssid, lastSsid, lastRssi;

    for (var e in events) {
      if (e.lat != null) { lastLat = e.lat; lastLon = e.lon; lastSpeed = e.speed; lastAccuracy = e.accuracy; }
      if (e.rssiRaw != null) { lastRssi = e.rssiRaw; lastBssid = e.bssid; lastSsid = e.ssid; }

      final isoTime = DateTime.fromMillisecondsSinceEpoch(e.tUtcMs).toUtc().toIso8601String();
      final rawSpeed = e.speed ?? lastSpeed;
      final speedVal = rawSpeed != null ? (rawSpeed is num ? (rawSpeed * 3.6).toStringAsFixed(2) : rawSpeed.toString()) : '0.00';

      rows.add([
        e.tUtcMs,
        isoTime,
        e.sessionId,
        e.participantId ?? '',
        e.platform,
        e.deviceModel ?? '',
        e.osVersion ?? '',
        e.lat ?? lastLat ?? '',
        e.lon ?? lastLon ?? '',
        speedVal,
        e.accuracy ?? lastAccuracy ?? '',
        e.bssid ?? lastBssid ?? '',
        e.ssid ?? lastSsid ?? '',
        e.rssiRaw ?? lastRssi ?? '',
        e.rssiSource ?? 'wifimanager',
        e.userLabelMode ?? '',
        e.phonePosition ?? '',
        sessionNote
      ]);
    }

    // 4. แปลงเป็น String รูปแบบ CSV
    final converter = CsvEncoder();
    String csvData = converter.convert(rows);

    // 5. หาที่อยู่โฟลเดอร์สำหรับเซฟไฟล์
    final directory = await getApplicationDocumentsDirectory();
    final participantId = events.isNotEmpty ? events.first.participantId : 'unknown_user';
    
    // แปลง Timestamp เป็นเวลาที่อ่านได้
    final ts = int.tryParse(sessionId) ?? DateTime.now().millisecondsSinceEpoch;
    final date = DateTime.fromMillisecondsSinceEpoch(ts);
    final timeStr = '${date.year}-${date.month.toString().padLeft(2,'0')}-${date.day.toString().padLeft(2,'0')}_${date.hour.toString().padLeft(2,'0')}-${date.minute.toString().padLeft(2,'0')}-${date.second.toString().padLeft(2,'0')}';
    
    final fileName = 'Trip_${participantId}_$timeStr.csv';
    final path = p.join(directory.path, fileName);
    
    // 6. เขียนไฟล์
    final file = File(path);
    await file.writeAsString(csvData, flush: true); // เพิ่ม flush: true ให้เขียนลงดิสก์สมบูรณ์ 100% ก่อนทำ Zip
    
    // พิมพ์ตัวอย่างข้อมูลลงใน Terminal ให้ผู้ใช้เห็นง่ายๆ
    debugPrint('\n========== ตัวอย่างข้อมูล CSV ในไฟล์ (18 Columns) ==========');
    debugPrint(csvData.length > 1000 ? '${csvData.substring(0, 1000)}...\n[ตัดข้อความบางส่วน]' : csvData);
    debugPrint('===============================================================\n');

    return path;
  }
}

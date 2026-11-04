import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'database.g.dart';

@DataClassName('EventRecord')
class EventStream extends Table {
  IntColumn get id => integer().autoIncrement()();
  
  // Reference and Sync
  IntColumn get tUtcMs => integer()();
  IntColumn get tMonoNs => integer()();
  TextColumn get sessionId => text()();
  
  // Data Source and Platform
  TextColumn get type => text()(); // gps, wifi_connected, accel, gyro, label
  TextColumn get platform => text()(); // ios, android
  
  // Network / Wi-Fi
  TextColumn get bssid => text().nullable()();
  TextColumn get ssid => text().nullable()();
  RealColumn get rssiRaw => real().nullable()();
  
  // Location
  RealColumn get lat => real().nullable()();
  RealColumn get lon => real().nullable()();
  RealColumn get speed => real().nullable()();
  RealColumn get accuracy => real().nullable()();
  
  // Motion (IMU)
  RealColumn get accelX => real().nullable()();
  RealColumn get accelY => real().nullable()();
  RealColumn get accelZ => real().nullable()();
  RealColumn get gyroX => real().nullable()();
  RealColumn get gyroY => real().nullable()();
  RealColumn get gyroZ => real().nullable()();
  
  // Labels (Ground Truth)
  TextColumn get userLabelMode => text().nullable()(); // walk, bike, motorcycle, car
  
  // New Missing Columns
  TextColumn get activityRecognitionMode => text().nullable()(); // Google AI
  TextColumn get participantId => text().nullable()(); // รหัสผู้ทดสอบ
  TextColumn get deviceModel => text().nullable()(); // รุ่นมือถือ
  TextColumn get osVersion => text().nullable()(); // เวอร์ชัน OS
  TextColumn get rssiSource => text().nullable()(); // wifimanager / shortcut
  TextColumn get phonePosition => text().nullable()(); // กระเป๋า, ถือ, หน้ารถ
}

@DriftDatabase(tables: [EventStream])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 2;

  // ฟังก์ชันเพิ่มข้อมูลลงตาราง
  Future<int> addEvent(EventStreamCompanion entry) {
    return into(eventStream).insert(entry);
  }
  
  // ดึงข้อมูลทั้งหมดของ session นั้นๆ
  Future<List<EventRecord>> getEventsBySession(String sessionId) {
    return (select(eventStream)..where((tbl) => tbl.sessionId.equals(sessionId))).get();
  }
  
  // เคลียร์ข้อมูลทั้งหมด (ใช้หลังจากอัปโหลดเสร็จ)
  Future<void> clearAllEvents() {
    return delete(eventStream).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'rssi_logger.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

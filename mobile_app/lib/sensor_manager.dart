import 'dart:async';
import 'dart:developer';
import 'dart:io' show Platform;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:drift/drift.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'database.dart';
import 'sensors/gps_provider.dart';
import 'sensors/imu_provider.dart';
import 'sensors/wifi_provider.dart';
import 'sensors/activity_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class SensorManager {
  final AppDatabase db;
  
  final GpsProvider gps = GpsProvider();
  final ImuProvider imu = ImuProvider();
  final WifiProvider wifi = WifiProvider();
  final ActivityProvider activity = ActivityProvider();

  String? _currentSessionId;
  String? getCurrentSessionId() => _currentSessionId;

  String _currentMode = 'walk'; 
  String _activityRecognitionMode = 'unknown';
  String getCurrentMode() => _currentMode;
  bool _isRecording = false;
  bool get isRecording => _isRecording;

  String _participantId = 'unknown';
  String _phonePosition = 'pocket';
  String _deviceModel = 'unknown';
  String _osVersion = 'unknown';

  Timer? _snapshotTimer;
  final _onSnapshotController = StreamController<void>.broadcast();
  Stream<void> get onSnapshot => _onSnapshotController.stream;

  dynamic get lastPosition => gps.lastPosition;
  dynamic get lastWifi => wifi.lastWifi;
  dynamic get lastAccel => imu.lastAccel;
  dynamic get lastGyro => imu.lastGyro;

  SensorManager(this.db);

  Future<void> initSensors() async {
    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;
    _deviceModel = '${androidInfo.manufacturer} ${androidInfo.model}';
    _osVersion = 'Android ${androidInfo.version.release}';

    await gps.init();
    await activity.init();
    imu.init();
    wifi.init();

    _listenToStreams();
  }

  bool _isListening = false;

  void _listenToStreams() {
    if (_isListening) return;
    _isListening = true;
    
    // Listen to keep provider states fresh
    gps.stream.listen((pos) {});
    imu.accelStream.listen((event) {});
    wifi.stream.listen((data) {});
    
    activity.stream.listen((mode) {
      _activityRecognitionMode = mode;
    });
  }

  Future<void> startRecording({String participantId = 'unknown', String phonePosition = 'pocket'}) async {
    if (_isRecording) return;
    _participantId = participantId;
    _phonePosition = phonePosition;
    
    _currentSessionId = DateTime.now().millisecondsSinceEpoch.toString();
    _isRecording = true;
    if (Platform.isAndroid) {
      FlutterBackgroundService().startService();
    }

    // Load sampling rate from Settings (defaults to 1000ms = 1s)
    final prefs = await SharedPreferences.getInstance();
    final rateMs = prefs.getInt('sampling_rate_ms') ?? 1000;

    _snapshotTimer?.cancel();
    
    // Take immediate first snapshot
    _takeSynchronizedSnapshot();
    
    // Schedule periodic synchronized snapshot
    _snapshotTimer = Timer.periodic(Duration(milliseconds: rateMs), (_) {
      _takeSynchronizedSnapshot();
    });
  }

  void stopRecording() {
    _isRecording = false;
    _snapshotTimer?.cancel();
    _snapshotTimer = null;
    _currentSessionId = null;
    if (Platform.isAndroid) {
      FlutterBackgroundService().invoke("stopService");
    }
  }

  void _takeSynchronizedSnapshot() {
    if (!_isRecording || _currentSessionId == null) return;
    final now = DateTime.now();

    final pos = gps.lastPosition;
    final lastW = wifi.lastWifi;
    final accel = imu.lastAccel;
    final gyro = imu.lastGyro;

    db.addEvent(EventStreamCompanion(
      tUtcMs: Value(now.millisecondsSinceEpoch),
      tMonoNs: Value(Timeline.now),
      sessionId: Value(_currentSessionId!),
      type: const Value('sync_sample'),
      platform: const Value('android'),
      lat: Value(pos?.latitude),
      lon: Value(pos?.longitude),
      speed: Value(pos?.speed),
      accuracy: Value(pos?.accuracy),
      accelX: Value(accel?.x),
      accelY: Value(accel?.y),
      accelZ: Value(accel?.z),
      gyroX: Value(gyro?.x),
      gyroY: Value(gyro?.y),
      gyroZ: Value(gyro?.z),
      bssid: Value(lastW != null ? lastW['bssid'] as String? : null),
      ssid: Value(lastW != null ? lastW['ssid'] as String? : null),
      rssiRaw: Value(lastW != null && lastW['rssi'] != null ? (lastW['rssi'] as num).toDouble() : null),
      userLabelMode: Value(_currentMode),
      activityRecognitionMode: Value(_activityRecognitionMode),
      participantId: Value(_participantId),
      deviceModel: Value(_deviceModel),
      osVersion: Value(_osVersion),
      rssiSource: Value(Platform.isAndroid ? 'wifimanager' : 'shortcut'),
      phonePosition: Value(_phonePosition),
    ));

    _onSnapshotController.add(null);
  }

  Future<List<String>> checkMissingPermissions() async {
    List<String> missing = [];
    missing.addAll(await gps.checkMissingPermissions());
    missing.addAll(await activity.checkMissingPermissions());
    if (Platform.isAndroid) {
      final notif = await Permission.notification.status;
      if (notif.isDenied || notif.isPermanentlyDenied) {
        missing.add('ยังไม่อนุญาตการแจ้งเตือน (Notification)');
      }
    }
    return missing;
  }

  Future<bool> isBatteryOptimizationIgnored() async {
    if (Platform.isAndroid) {
      return await Permission.ignoreBatteryOptimizations.isGranted;
    }
    return true;
  }

  Future<void> requestIgnoreBatteryOptimization() async {
    if (Platform.isAndroid) {
      await Permission.ignoreBatteryOptimizations.request();
    }
  }

  Future<void> requestPermissionsAndSettings() async {
    await gps.requestPermissionsAndSettings();
    await activity.requestPermissionsAndSettings();
    if (Platform.isAndroid) {
      await Permission.notification.request();
      await Permission.ignoreBatteryOptimizations.request();
      await Permission.nearbyWifiDevices.request();
    }
    await initSensors();
  }

  void updateMode(String mode) {
    _currentMode = mode;
  }
}

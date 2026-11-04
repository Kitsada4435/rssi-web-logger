import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'dart:async';
import 'database.dart';
import 'sensor_manager.dart';
import 'export_manager.dart';
import 'history_page.dart';
import 'settings_page.dart';
import 'background_service.dart';
import 'cloud_manager.dart';
import 'dart:io';
import 'package:permission_handler/permission_handler.dart';

import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  
  await initializeService(); // Init Background Service
  
  final db = AppDatabase();
  final sensorManager = SensorManager(db);
  runApp(MyApp(db: db, sensorManager: sensorManager));
}

class MyApp extends StatelessWidget {
  final AppDatabase db;
  final SensorManager sensorManager;
  
  const MyApp({super.key, required this.db, required this.sensorManager});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RSSI Logger',
      debugShowCheckedModeBanner: false, // เอาป้าย Debug ออก
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
        useMaterial3: true,
      ),
      home: HomePage(db: db, sensorManager: sensorManager),
    );
  }
}

class HomePage extends StatefulWidget {
  final AppDatabase db;
  final SensorManager sensorManager;
  
  const HomePage({super.key, required this.db, required this.sensorManager});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          DashboardPage(db: widget.db, sensorManager: widget.sensorManager),
          if (_currentIndex == 1) const HistoryPage() else const SizedBox.shrink(),
          if (_currentIndex == 2) const SettingsPage() else const SizedBox.shrink(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: const Color(0xFF0F172A),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'อัดข้อมูล',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder_rounded),
            label: 'จัดการไฟล์',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_rounded),
            label: 'ตั้งค่า',
          ),
        ],
      ),
    );
  }
}

class DashboardPage extends StatefulWidget {
  final AppDatabase db;
  final SensorManager sensorManager;
  
  const DashboardPage({super.key, required this.db, required this.sensorManager});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  bool _isRecording = false;
  bool _isProcessing = false; // ป้องกันการกดปุ่มรัว
  String _currentMode = 'walk';
  int _recordCount = 0;
  Timer? _uiTimer;
  String? _lastSessionId;
  List<String> _missingPermissions = [];
  bool _isBatteryIgnored = true;

  // New Fields
  final TextEditingController _participantController = TextEditingController();
  String _phonePosition = 'pocket';

  StreamSubscription<void>? _snapshotSub;

  @override
  void initState() {
    super.initState();
    _loadParticipantId();
    widget.sensorManager.initSensors();

    // Listen to synchronized snapshots to refresh UI simultaneously in lockstep
    _snapshotSub = widget.sensorManager.onSnapshot.listen((_) {
      if (mounted) {
        setState(() {
          if (_isRecording) {
            _recordCount++;
          }
          _currentMode = widget.sensorManager.getCurrentMode();
        });
      }
    });

    // Start UI timer immediately to refresh dashboard and monitor permissions
    _uiTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (!_isRecording) {
        final missing = await widget.sensorManager.checkMissingPermissions();
        final batteryIgnored = await widget.sensorManager.isBatteryOptimizationIgnored();
        if (mounted) {
          setState(() {
            _missingPermissions = missing;
            _isBatteryIgnored = batteryIgnored;
          });
        }
      } else {
        final missing = await widget.sensorManager.checkMissingPermissions();
        if (mounted && missing.isNotEmpty) {
          // Auto-stop recording if permissions are lost midway
          widget.sensorManager.stopRecording();
          setState(() {
            _isRecording = false;
            _missingPermissions = missing;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🛑 หยุดบันทึกอัตโนมัติ: สูญเสียสัญญาณ GPS หรือสิทธิ์การเข้าถึงเซ็นเซอร์!'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 4),
            )
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _snapshotSub?.cancel();
    _uiTimer?.cancel();
    _participantController.dispose();
    super.dispose();
  }

  Future<void> _loadParticipantId() async {
    final prefs = await SharedPreferences.getInstance();
    String? id;

    if (Platform.isIOS) {
      // 1. Try reading from iOS Keychain (survives app uninstall & reinstall)
      try {
        const secureStorage = FlutterSecureStorage();
        id = await secureStorage.read(key: 'participant_id');
      } catch (e) {
        debugPrint('Keychain read error: $e');
      }
    } else if (Platform.isAndroid) {
      // 1. Try reading Android Hardware ID (Settings.Secure.ANDROID_ID)
      try {
        const channel = MethodChannel('com.example.rssi_logger/device');
        final String? hwId = await channel.invokeMethod<String>('getAndroidHardwareId');
        if (hwId != null && hwId.isNotEmpty) {
          id = hwId.length >= 8 ? hwId.substring(0, 8) : hwId;
        }
      } catch (e) {
        debugPrint('Android HW ID error: $e');
      }
    }

    // 2. Check SharedPreferences if not found above
    if (id == null || id.isEmpty) {
      id = prefs.getString('participant_id');
    }

    // 3. Fallback: generate 8-char short UUID
    if (id == null || id.isEmpty) {
      id = const Uuid().v4().substring(0, 8);
    }

    // 4. Save to SharedPreferences and iOS Keychain
    await prefs.setString('participant_id', id);
    if (Platform.isIOS) {
      try {
        const secureStorage = FlutterSecureStorage();
        await secureStorage.write(key: 'participant_id', value: id);
      } catch (e) {
        debugPrint('Keychain write error: $e');
      }
    }

    if (mounted) {
      setState(() {
        _participantController.text = id!;
      });
    }
  }

  Future<void> _updateParticipantId(String newId) async {
    final cleanId = newId.trim();
    if (cleanId.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('participant_id', cleanId);

    if (Platform.isIOS) {
      try {
        const secureStorage = FlutterSecureStorage();
        await secureStorage.write(key: 'participant_id', value: cleanId);
      } catch (e) {
        debugPrint('Keychain write error: $e');
      }
    }
  }

  void _toggleRecording() async {
    if (_isProcessing) return; // ป้องกันการกดเบิ้ล

    if (!_isRecording) {
      setState(() {
        _isRecording = true;
        _isProcessing = false;
        _recordCount = 0; // Reset counter for the new trip
      });
      
      await widget.sensorManager.startRecording(
        participantId: _participantController.text.isNotEmpty ? _participantController.text : 'unknown',
        phonePosition: _phonePosition,
      );
      _lastSessionId = widget.sensorManager.getCurrentSessionId();
    } else {
      setState(() {
         _isRecording = false; // ปิดสถานะ Recording ทันทีที่กด
         _isProcessing = true; // แต่ยังล็อคปุ่มไว้จนกว่าจะอัปโหลดเสร็จ
      });
      widget.sensorManager.stopRecording();
      
      // Auto export CSV when stopping
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('กำลังประมวลผลและสร้างไฟล์ CSV...'), duration: Duration(seconds: 1)),
        );
      }
      
      if (_lastSessionId != null) {
        final exporter = ExportManager(widget.db);
        final csvPath = await exporter.exportToCsv(_lastSessionId!);
        
        // 🚀 Auto-Upload to Google Drive
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('กำลังซิงค์ข้อมูลขึ้น Google Drive...'), duration: Duration(seconds: 2)),
           );
        }
        
        // เราต้อง import cloud_manager.dart ด้วย (เดี๋ยวเพิ่มด้านบน)
        final success = await CloudManager.zipAndUpload(csvFile: File(csvPath));
        if (success) {
           if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('อัปโหลด Google Drive สำเร็จ! (เก็บไฟล์สำรองไว้ในเครื่องแล้ว)')));
        } else {
           if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ซิงค์ล้มเหลว (บันทึกไว้ในเครื่องแล้ว รออัปโหลดภายหลัง)')));
        }
      }

      if (mounted) {
        setState(() {
          _isProcessing = false; // ปลดล็อคปุ่ม
        });
      }
    }
  }

  Widget _buildCompactModeBtn(String mode, IconData icon, String label) {
    final isSelected = _currentMode == mode;
    return GestureDetector(
      onTap: () {
        widget.sensorManager.updateMode(mode);
        setState(() => _currentMode = mode);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: MediaQuery.of(context).size.width / 4 - 14,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? const Color(0xFF0F172A) : Colors.grey.shade300, width: 2),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))] : [],
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? Colors.white : Colors.black87, size: 28),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: isSelected ? Colors.white : Colors.black87,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildDashMetric(String title, String value, String unit) {
    return Column(
      children: [
        Text(title, style: const TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
        const SizedBox(height: 4),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
            const SizedBox(width: 4),
            Text(unit, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.bold)),
          ],
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // High contrast background for outdoor visibility
      appBar: AppBar(
        title: const Text('RSSI LOGGER', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline_rounded, color: Colors.black87),
            tooltip: 'คำแนะนำการตั้งค่าเครื่อง',
            onPressed: () => _showSetupGuide(context),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 2.0), // แยกโซนชัดเจน
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Permission Warning Banner
              if (_missingPermissions.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                  child: Column(
                    children: [
                      const Text('⚠️ ขาดสิทธิ์การเข้าถึง (แตะเพื่อแก้ไข)', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                      ElevatedButton(
                        onPressed: () => widget.sensorManager.requestPermissionsAndSettings(),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 32)),
                        child: const Text('เปิดการตั้งค่า'),
                      )
                    ],
                  )
                ),

              // Battery Optimization Advisory Banner
              if (!_isBatteryIgnored && !_isRecording)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.bolt_rounded, color: Colors.amber.shade900, size: 24),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'แนะนำ: ปิดโหมดประหยัดแบตเตอรี่เพื่อไม่ให้แอปหลับขณะจอดับ',
                          style: TextStyle(color: Colors.amber.shade900, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      TextButton(
                        onPressed: () async {
                          await widget.sensorManager.requestIgnoreBatteryOptimization();
                          final ignored = await widget.sensorManager.isBatteryOptimizationIgnored();
                          if (mounted) setState(() => _isBatteryIgnored = ignored);
                        },
                        style: TextButton.styleFrom(
                          backgroundColor: Colors.amber.shade800,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('ยกเว้น', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),

              // Setup Panel (Hides when recording to maximize space)
              if (!_isRecording)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200)
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextField(
                          controller: _participantController,
                          readOnly: false,
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87),
                          decoration: const InputDecoration(
                            labelText: 'USER ID (แก้ไขได้)',
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                            suffixIcon: Icon(Icons.edit, size: 14, color: Colors.blueAccent),
                            suffixIconConstraints: BoxConstraints(minWidth: 16, minHeight: 16),
                          ),
                          onChanged: _updateParticipantId,
                        ),
                      ),
                      Container(width: 1, height: 30, color: Colors.grey.shade300, margin: const EdgeInsets.symmetric(horizontal: 12)),
                      Expanded(
                        flex: 4,
                        child: DropdownButtonFormField<String>(
                          value: _phonePosition,
                          decoration: const InputDecoration(labelText: 'POSITION', border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero, labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87),
                          icon: const Icon(Icons.expand_more, size: 20),
                          items: const [
                            DropdownMenuItem(value: 'pocket', child: Text('Pocket')),
                            DropdownMenuItem(value: 'hand', child: Text('Hand')),
                            DropdownMenuItem(value: 'bag', child: Text('Bag')),
                            DropdownMenuItem(value: 'mount', child: Text('Mount')),
                          ],
                          onChanged: (val) { if (val != null) setState(() => _phonePosition = val); },
                        ),
                      ),
                    ],
                  )
                ),
              
              if (!_isRecording) const SizedBox(height: 16),
              
              // Mode Selection Grid (Always visible for Quick Tag)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildCompactModeBtn('walk', Icons.directions_walk_rounded, 'WALK'),
                  _buildCompactModeBtn('bike', Icons.pedal_bike_rounded, 'BIKE'),
                  _buildCompactModeBtn('motorcycle', Icons.motorcycle_rounded, 'MOTO'),
                  _buildCompactModeBtn('car', Icons.directions_car_rounded, 'CAR'),
                ],
              ),
              const SizedBox(height: 16),

              // Main Dashboard (Vibrant Bright Premium Card)
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E3A8A), Color(0xFF3B82F6)], // Deep Blue to Bright Blue
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.4), blurRadius: 24, offset: const Offset(0, 12))
                    ]
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Status Label
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        decoration: BoxDecoration(
                           color: Colors.white.withOpacity(0.2),
                           borderRadius: BorderRadius.circular(24),
                           border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_isRecording) const Icon(Icons.fiber_manual_record, color: Color(0xFFFCA5A5), size: 14), // Soft red dot
                            if (_isRecording) const SizedBox(width: 8),
                            Text(
                              _isRecording ? 'RECORDING • $_recordCount' : 'READY TO START',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                                fontSize: 13
                              )
                            ),
                          ],
                        ),
                      ),
                      
                      // RSSI Value (Massive display)
                      Column(
                        children: [
                          const Text('Wi-Fi RSSI', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 2)),
                          const SizedBox(height: 8),
                          Text(
                            widget.sensorManager.lastWifi != null ? '${widget.sensorManager.lastWifi!['rssi']}' : '--',
                            style: const TextStyle(color: Colors.white, fontSize: 96, fontWeight: FontWeight.w900, height: 1.0, shadows: [
                               Shadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))
                            ])
                          ),
                          const Text('dBm', style: TextStyle(color: Colors.white70, fontSize: 20, fontWeight: FontWeight.w900)),
                        ]
                      ),

                      // Speed & Accuracy (Row)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                             _buildDashMetric('SPEED', widget.sensorManager.lastPosition != null ? (widget.sensorManager.lastPosition!.speed * 3.6).toStringAsFixed(0) : '--', 'km/h'),
                             Container(width: 2, height: 40, color: Colors.white.withOpacity(0.2)),
                             _buildDashMetric('GPS ACC', widget.sensorManager.lastPosition != null ? '±${widget.sensorManager.lastPosition!.accuracy.toStringAsFixed(0)}' : '--', 'm'),
                          ],
                        ),
                      ),
                    ],
                  )
                )
              ),
              
              const SizedBox(height: 16),
              
              // Action Button (Massive High Contrast)
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isRecording ? const Color(0xFFEF4444) : const Color(0xFF10B981), // Vivid Red / Vivid Green
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  elevation: 0,
                ),
                onPressed: ((_missingPermissions.isNotEmpty && !_isRecording) || _isProcessing) ? null : _toggleRecording,
                child: _isProcessing 
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3)),
                        SizedBox(width: 16),
                        Text('UPLOADING...', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.white)),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_isRecording ? Icons.stop_rounded : Icons.play_arrow_rounded, size: 36),
                        const SizedBox(width: 12),
                        Text(
                          _isRecording ? 'STOP TRIP' : 'START TRIP',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                        ),
                      ],
                    ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showSetupGuide(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.settings_suggest_rounded, color: Color(0xFF1E3A8A), size: 28),
                  SizedBox(width: 10),
                  Text(
                    'คู่มือตั้งค่าเครื่องก่อนเก็บข้อมูล',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Card 1: Battery Optimization
              _buildGuideCard(
                icon: Icons.battery_charging_full_rounded,
                iconColor: _isBatteryIgnored ? Colors.green : Colors.amber.shade800,
                title: 'แบตเตอรี่ (Battery Saver)',
                desc: 'ตั้งค่าเป็น "ไม่จำกัด" (Unrestricted) เพื่อให้แอปบันทึกข้อมูลเบื้องหลังได้ตลอดเวลาขณะจอดับ',
                statusText: _isBatteryIgnored ? 'ยกเว้นแล้ว (พร้อมใช้งาน)' : 'ยังไม่ได้ยกเว้น (อาจถูกระบบปิด)',
                statusColor: _isBatteryIgnored ? Colors.green : Colors.red,
                actionLabel: _isBatteryIgnored ? null : 'ขอปิดโหมดประหยัดแบตเตอรี่',
                onAction: () async {
                  await widget.sensorManager.requestIgnoreBatteryOptimization();
                  final ignored = await widget.sensorManager.isBatteryOptimizationIgnored();
                  setModalState(() => _isBatteryIgnored = ignored);
                  if (mounted) setState(() => _isBatteryIgnored = ignored);
                },
              ),
              const SizedBox(height: 12),
              // Card 2: GPS Location
              _buildGuideCard(
                icon: Icons.location_on_rounded,
                iconColor: Colors.blueAccent,
                title: 'ตำแหน่ง GPS (Location Always)',
                desc: 'ต้องเลือก "อนุญาตตลอดเวลา" (Allow all the time) และเปิดโหมดความแม่นยำสูง (High Accuracy)',
                statusText: 'จำเป็นสำหรับการตรวจวัดพิกัดและความเร็ว',
                statusColor: Colors.blueAccent,
                actionLabel: 'เปิดการตั้งค่าตำแหน่ง',
                onAction: () async {
                  await widget.sensorManager.requestPermissionsAndSettings();
                },
              ),
              const SizedBox(height: 12),
              // Card 3: Wi-Fi Scanning
              _buildGuideCard(
                icon: Icons.wifi_rounded,
                iconColor: Colors.teal,
                title: 'เปิด Wi-Fi ของเครื่องเสมอ',
                desc: 'เปิด Wi-Fi ทิ้งไว้แม้ไม่ได้เชื่อมต่ออินเทอร์เน็ต เพื่อให้เซ็นเซอร์อ่านค่า RSSI ได้ตลอดเส้นทาง',
                statusText: 'พร้อมสแกนความแรงสัญญาณ',
                statusColor: Colors.teal,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => openAppSettings(),
                icon: const Icon(Icons.settings_applications_rounded),
                label: const Text('เปิดหน้าการตั้งค่าแอปพลิเคชัน (App Info)'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGuideCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String desc,
    required String statusText,
    required Color statusColor,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 24),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(desc, style: TextStyle(color: Colors.grey.shade600, fontSize: 12, height: 1.3)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: onAction,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 32),
              ),
              child: Text(actionLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            )
          ]
        ],
      ),
    );
  }
}

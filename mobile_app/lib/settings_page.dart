import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import 'cloud_manager.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final TextEditingController _gasUrlController = TextEditingController();
  int _samplingRateMs = 1000;
  bool _isLoading = true;
  bool _isTesting = false;
  String? _testResult;
  bool _testSuccess = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _gasUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final url = await CloudManager.getGasUrl();
    final rate = prefs.getInt('sampling_rate_ms') ?? 1000;

    setState(() {
      _gasUrlController.text = url;
      _samplingRateMs = rate;
      _isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    final url = _gasUrlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณากรอก URL ให้ถูกต้อง'), backgroundColor: Colors.red),
      );
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await CloudManager.saveGasUrl(url);
    await prefs.setInt('sampling_rate_ms', _samplingRateMs);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _resetToDefaultUrl() async {
    setState(() {
      _gasUrlController.text = CloudManager.defaultGasUrl;
    });
    await CloudManager.saveGasUrl(CloudManager.defaultGasUrl);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('รีเซ็ตเป็นค่าเริ่มต้นแล้ว')),
      );
    }
  }

  Future<void> _testConnection() async {
    final url = _gasUrlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    final success = await CloudManager.testConnection(url);

    if (mounted) {
      setState(() {
        _isTesting = false;
        _testSuccess = success;
        _testResult = success ? 'เชื่อมต่อ Google Apps Script สำเร็จ (200 OK)' : 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบ URL หรืออินเทอร์เน็ต';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('ตั้งค่าระบบ (SETTINGS)', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 2.0),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Section 1: Google Apps Script / Drive Sync
                _buildSectionHeader('☁️ CLOUD SYNC (GOOGLE DRIVE)'),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Google Apps Script Web App URL',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _gasUrlController,
                        maxLines: 2,
                        style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                        decoration: InputDecoration(
                          hintText: 'https://script.google.com/macros/s/.../exec',
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.all(12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_testResult != null)
                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _testSuccess ? Colors.green.shade50 : Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _testSuccess ? Colors.green.shade200 : Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(_testSuccess ? Icons.check_circle : Icons.error, color: _testSuccess ? Colors.green : Colors.red, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_testResult!, style: TextStyle(color: _testSuccess ? Colors.green.shade900 : Colors.red.shade900, fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isTesting ? null : _testConnection,
                              icon: _isTesting
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Icon(Icons.wifi_tethering, size: 18),
                              label: const Text('ทดสอบเชื่อมต่อ'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          TextButton(
                            onPressed: _resetToDefaultUrl,
                            child: const Text('รีเซ็ตค่าเริ่มต้น', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          )
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 2: Sensor Sampling Rate
                _buildSectionHeader('⏱️ SENSOR SAMPLING RATE'),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ความถี่ในการบันทึกข้อมูล (Sampling Interval)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'กำหนดช่วงเวลาการดึงค่า Wi-Fi และตำแหน่ง GPS ลงฐานข้อมูล',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<int>(
                        value: _samplingRateMs,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        ),
                        items: const [
                          DropdownMenuItem(value: 500, child: Text('0.5 วินาที (500 ms) - ความละเอียดสูง')),
                          DropdownMenuItem(value: 1000, child: Text('1.0 วินาที (1,000 ms) - มาตรฐานงานวิจัย [แนะนำ]')),
                          DropdownMenuItem(value: 2000, child: Text('2.0 วินาที (2,000 ms) - ปกติ')),
                          DropdownMenuItem(value: 5000, child: Text('5.0 วินาที (5,000 ms) - ประหยัดพลังงาน')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _samplingRateMs = val);
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 3: App Information
                _buildSectionHeader('ℹ️ APP INFORMATION'),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      _buildInfoRow('ชื่อแอป', 'RSSI Logger'),
                      const Divider(),
                      _buildInfoRow('เวอร์ชัน', '1.0.0 (Release)'),
                      const Divider(),
                      _buildInfoRow('สถาปัตยกรรม', 'Flutter + SQLite + GAS'),
                      const SizedBox(height: 14),
                      OutlinedButton.icon(
                        onPressed: () => openAppSettings(),
                        icon: const Icon(Icons.settings_applications),
                        label: const Text('เปิดหน้าการตั้งค่าแอปในระบบ (App Info)'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 40),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Save Button
                ElevatedButton(
                  onPressed: _saveSettings,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('บันทึกการตั้งค่า', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2, color: Colors.blueGrey),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

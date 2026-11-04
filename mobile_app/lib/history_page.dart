import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'cloud_manager.dart';
import 'package:path/path.dart' as p;

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<File> _csvFiles = [];
  Set<String> _selectedPaths = {};
  bool _isLoading = true;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _loadFiles();
  }

  Future<void> _loadFiles() async {
    setState(() => _isLoading = true);
    try {
      final dir = await getApplicationDocumentsDirectory();
      final files = dir.listSync().whereType<File>().where((file) => file.path.endsWith('.csv')).toList();
      files.sort((a, b) => b.lastModifiedSync().compareTo(a.lastModifiedSync()));
      
      if (mounted) {
        setState(() {
          _csvFiles = files;
          _isLoading = false;
          // Clear selections that no longer exist
          _selectedPaths.removeWhere((path) => !files.any((f) => f.path == path));
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toggleSelection(String path) {
    setState(() {
      if (_selectedPaths.contains(path)) {
        _selectedPaths.remove(path);
      } else {
        _selectedPaths.add(path);
      }
    });
  }

  void _selectAll() {
    setState(() {
      if (_selectedPaths.length == _csvFiles.length) {
        _selectedPaths.clear();
      } else {
        _selectedPaths = _csvFiles.map((f) => f.path).toSet();
      }
    });
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(2)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  Future<void> _deleteSelected() async {
    if (_selectedPaths.isEmpty) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ยืนยันการลบ', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('คุณต้องการลบ ${_selectedPaths.length} ไฟล์ที่เลือกใช่หรือไม่?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: const Text('ลบข้อมูล', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      for (final path in _selectedPaths) {
        final file = File(path);
        if (await file.exists()) await file.delete();
      }
      _selectedPaths.clear();
      _loadFiles();
    }
  }

  Future<void> _syncSelected() async {
    if (_selectedPaths.isEmpty) return;
    setState(() => _isUploading = true);
    
    int successCount = 0;
    int failCount = 0;
    
    final filesToUpload = _csvFiles.where((f) => _selectedPaths.contains(f.path)).toList();
    
    for (final file in filesToUpload) {
      final success = await CloudManager.zipAndUpload(csvFile: file);
      if (success) {
        successCount++;
        // 🛑 ปิดการลบไฟล์อัตโนมัติ 
        // await file.delete();
      } else {
        failCount++;
      }
    }
    
    if (mounted) {
      setState(() => _isUploading = false);
      _selectedPaths.clear();
      _loadFiles();
      
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('อัปโหลดสำเร็จ $successCount ไฟล์, ล้มเหลว $failCount ไฟล์'),
        backgroundColor: failCount > 0 ? Colors.orange.shade800 : Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _shareFile(File file) {
    // ignore: deprecated_member_use
    Share.shareXFiles([XFile(file.path)], text: 'ข้อมูล RSSI GPS Logger');
  }

  @override
  Widget build(BuildContext context) {
    final allSelected = _csvFiles.isNotEmpty && _selectedPaths.length == _csvFiles.length;
    
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('FILES MANAGER', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Colors.black87)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 2.0), // แยกโซนชัดเจน
        ),
        actions: [
          if (_csvFiles.isNotEmpty)
            TextButton.icon(
              onPressed: _selectAll,
              icon: Icon(allSelected ? Icons.deselect : Icons.select_all, color: Colors.blueAccent),
              label: Text(allSelected ? 'ยกเลิก' : 'เลือกทั้งหมด', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _csvFiles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.folder_open_rounded, size: 80, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text('ไม่มีไฟล์ข้อมูลค้างในระบบ', style: TextStyle(color: Colors.grey.shade500, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                )
              : Stack(
                  children: [
                    ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 100, left: 12, right: 12),
                      itemCount: _csvFiles.length,
                      itemBuilder: (context, index) {
                        final file = _csvFiles[index];
                        final stat = file.statSync();
                        final rawFileName = p.basename(file.path);
                        final isSelected = _selectedPaths.contains(file.path);

                        // แปลงชื่อไฟล์ให้สั้นและอ่านง่าย (เช่น 14/10 22:15:30)
                        String displayTitle = rawFileName;
                        final parts = rawFileName.split('_');
                        if (parts.length >= 4) {
                          final tsString = parts.last.replaceAll('.csv', '');
                          final ts = int.tryParse(tsString);
                          if (ts != null) {
                            final date = DateTime.fromMillisecondsSinceEpoch(ts);
                            displayTitle = 'Trip: ${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
                          }
                        }

                        return Card(
                          elevation: isSelected ? 8 : 2,
                          shadowColor: isSelected ? Colors.blueAccent.withOpacity(0.4) : Colors.black12,
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: isSelected ? Colors.blueAccent : Colors.grey.shade200, width: isSelected ? 2 : 1)
                          ),
                          child: InkWell(
                            onTap: () => _toggleSelection(file.path),
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Row(
                                children: [
                                  // Checkbox with rounded design
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isSelected ? Colors.blueAccent : Colors.grey.shade100,
                                      border: Border.all(color: isSelected ? Colors.blueAccent : Colors.grey.shade300, width: 2)
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(4.0),
                                      child: Icon(Icons.check, size: 16, color: isSelected ? Colors.white : Colors.transparent),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  
                                  // File Icon with soft background
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(12)
                                    ),
                                    child: const Icon(Icons.insert_drive_file_rounded, color: Colors.green, size: 28),
                                  ),
                                  const SizedBox(width: 16),
                                  
                                  // File Info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(displayTitle, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                                              child: Text(_formatBytes(stat.size), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade700)),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(stat.modified.toString().split('.').first, style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                                          ],
                                        )
                                      ],
                                    ),
                                  ),
                                  
                                  // Share Action
                                  Container(
                                    decoration: BoxDecoration(color: Colors.grey.shade50, shape: BoxShape.circle),
                                    child: IconButton(
                                      icon: const Icon(Icons.ios_share_rounded, color: Colors.blueGrey, size: 22),
                                      onPressed: () => _shareFile(file),
                                      tooltip: 'แชร์ไฟล์',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    
                    // Upload Overlay
                    if (_isUploading)
                      Container(
                        color: Colors.white.withOpacity(0.8), // Softer overlay
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.all(32.0),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)]
                            ),
                            child: const Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                CircularProgressIndicator(color: Colors.blueAccent),
                                SizedBox(height: 24),
                                Text('กำลังซิงค์ขึ้น Cloud...', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black87))
                              ],
                            ),
                          ),
                        ),
                      )
                  ],
                ),
      
      // Bottom Action Bar (Bright Premium Gradient)
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: _selectedPaths.isNotEmpty && !_isUploading
          ? Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF2563EB)]), // Vibrant Blue Gradient
                borderRadius: BorderRadius.circular(32),
                boxShadow: [BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 10))]
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                    child: Text('${_selectedPaths.length} เลือกแล้ว', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                  ),
                  const SizedBox(width: 12),
                  Container(width: 1, height: 24, color: Colors.white.withOpacity(0.3)),
                  const SizedBox(width: 12),
                  TextButton.icon(
                    onPressed: _deleteSelected,
                    style: TextButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    icon: const Icon(Icons.delete_outline, color: Colors.white),
                    label: const Text('ลบ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _syncSelected,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.blue.shade700,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.cloud_upload_rounded, size: 20),
                    label: const Text('อัปโหลด', style: TextStyle(fontWeight: FontWeight.w900)),
                  )
                ],
              ),
            )
          : null,
    );
  }
}

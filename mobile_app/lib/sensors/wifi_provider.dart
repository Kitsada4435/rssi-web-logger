import 'dart:async';
import 'dart:developer';
import 'package:flutter/services.dart';

class WifiProvider {
  static const EventChannel _wifiChannel = EventChannel('com.example.rssi_logger/wifi_rssi');
  StreamSubscription<dynamic>? _subscription;
  Map<String, dynamic>? lastWifi;

  final _controller = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get stream => _controller.stream;

  void init() {
    _subscription ??= _wifiChannel.receiveBroadcastStream().listen((event) {
      final data = Map<String, dynamic>.from(event);
      lastWifi = data;
      _controller.add(data);
    }, onError: (dynamic error) {
      log('Wi-Fi stream error: $error');
    });
  }
}

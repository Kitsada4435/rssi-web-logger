import 'dart:async';
import 'package:sensors_plus/sensors_plus.dart';

class ImuProvider {
  StreamSubscription<AccelerometerEvent>? _accelSub;
  StreamSubscription<GyroscopeEvent>? _gyroSub;
  
  AccelerometerEvent? lastAccel;
  GyroscopeEvent? lastGyro;

  final _accelController = StreamController<AccelerometerEvent>.broadcast();
  Stream<AccelerometerEvent> get accelStream => _accelController.stream;

  final _gyroController = StreamController<GyroscopeEvent>.broadcast();
  Stream<GyroscopeEvent> get gyroStream => _gyroController.stream;

  void init() {
    _accelSub ??= accelerometerEventStream().listen((event) {
      lastAccel = event;
      _accelController.add(event);
    });

    _gyroSub ??= gyroscopeEventStream().listen((event) {
      lastGyro = event;
      _gyroController.add(event);
    });
  }
}

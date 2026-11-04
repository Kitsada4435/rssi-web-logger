import 'dart:async';
import 'dart:developer';
import 'package:flutter_activity_recognition/flutter_activity_recognition.dart' as ar;

class ActivityProvider {
  StreamSubscription<ar.Activity>? _subscription;
  String currentMode = 'unknown';

  final _controller = StreamController<String>.broadcast();
  Stream<String> get stream => _controller.stream;

  Future<void> init() async {
    ar.ActivityPermission actReqResult = await ar.FlutterActivityRecognition.instance.checkPermission();
    if (actReqResult == ar.ActivityPermission.DENIED) {
      actReqResult = await ar.FlutterActivityRecognition.instance.requestPermission();
    }
    
    if (actReqResult == ar.ActivityPermission.GRANTED) {
      _subscription ??= ar.FlutterActivityRecognition.instance.activityStream.listen((event) {
        log('Activity Recognition: ${event.type.name} (${event.confidence.name})');
        String mode = event.type.name.toLowerCase();
        if (event.type == ar.ActivityType.IN_VEHICLE) {
          mode = 'in_vehicle';
        } else if (event.type == ar.ActivityType.WALKING) {
          mode = 'walk';
        } else if (event.type == ar.ActivityType.ON_BICYCLE) {
          mode = 'bike';
        } else if (event.type == ar.ActivityType.STILL) {
          mode = 'still';
        }
        currentMode = mode;
        _controller.add(mode);
      }, onError: (dynamic error) {
        log('Activity Recognition Error: $error');
      });
    }
  }

  Future<List<String>> checkMissingPermissions() async {
    List<String> missing = [];
    ar.ActivityPermission actReqResult = await ar.FlutterActivityRecognition.instance.checkPermission();
    if (actReqResult == ar.ActivityPermission.DENIED || actReqResult == ar.ActivityPermission.PERMANENTLY_DENIED) {
      missing.add('ยังไม่อนุญาตเซ็นเซอร์ตรวจจับการเคลื่อนไหว (Physical Activity)');
    }
    return missing;
  }

  Future<void> requestPermissionsAndSettings() async {
    ar.ActivityPermission actReqResult = await ar.FlutterActivityRecognition.instance.checkPermission();
    if (actReqResult == ar.ActivityPermission.DENIED) {
      actReqResult = await ar.FlutterActivityRecognition.instance.requestPermission();
    }
  }
}

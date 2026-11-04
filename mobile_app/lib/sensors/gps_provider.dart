import 'dart:async';
import 'dart:developer';
import 'package:geolocator/geolocator.dart';

class GpsProvider {
  StreamSubscription<Position>? _positionStream;
  Position? lastPosition;
  
  final _controller = StreamController<Position>.broadcast();
  Stream<Position> get stream => _controller.stream;

  Future<void> init() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (serviceEnabled) {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        LocationSettings locationSettings;
        try {
          locationSettings = AppleSettings(
            accuracy: LocationAccuracy.high,
            activityType: ActivityType.otherNavigation,
            pauseLocationUpdatesAutomatically: false,
            showBackgroundLocationIndicator: true,
            allowBackgroundLocationUpdates: true,
            distanceFilter: 0,
          );
        } catch (_) {
          locationSettings = const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 0,
          );
        }

        _positionStream ??= Geolocator.getPositionStream(
          locationSettings: locationSettings,
        ).listen((Position position) {
          lastPosition = position;
          _controller.add(position);
        }, onError: (dynamic error) {
          log('GPS Error: $error');
        });
      }
    }
  }

  Future<List<String>> checkMissingPermissions() async {
    List<String> missing = [];
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      missing.add('Location Service (GPS) ถูกปิดอยู่');
    } else {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        missing.add('ยังไม่อนุญาตการเข้าถึงตำแหน่ง (Location)');
      }
    }
    return missing;
  }

  Future<void> requestPermissionsAndSettings() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      await Geolocator.openLocationSettings();
      return;
    }
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      await Geolocator.openAppSettings();
    }
  }
}

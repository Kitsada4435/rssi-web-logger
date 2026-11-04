// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $EventStreamTable extends EventStream
    with TableInfo<$EventStreamTable, EventRecord> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $EventStreamTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _tUtcMsMeta = const VerificationMeta('tUtcMs');
  @override
  late final GeneratedColumn<int> tUtcMs = GeneratedColumn<int>(
    't_utc_ms',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tMonoNsMeta = const VerificationMeta(
    'tMonoNs',
  );
  @override
  late final GeneratedColumn<int> tMonoNs = GeneratedColumn<int>(
    't_mono_ns',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sessionIdMeta = const VerificationMeta(
    'sessionId',
  );
  @override
  late final GeneratedColumn<String> sessionId = GeneratedColumn<String>(
    'session_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _platformMeta = const VerificationMeta(
    'platform',
  );
  @override
  late final GeneratedColumn<String> platform = GeneratedColumn<String>(
    'platform',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bssidMeta = const VerificationMeta('bssid');
  @override
  late final GeneratedColumn<String> bssid = GeneratedColumn<String>(
    'bssid',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ssidMeta = const VerificationMeta('ssid');
  @override
  late final GeneratedColumn<String> ssid = GeneratedColumn<String>(
    'ssid',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _rssiRawMeta = const VerificationMeta(
    'rssiRaw',
  );
  @override
  late final GeneratedColumn<double> rssiRaw = GeneratedColumn<double>(
    'rssi_raw',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _latMeta = const VerificationMeta('lat');
  @override
  late final GeneratedColumn<double> lat = GeneratedColumn<double>(
    'lat',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lonMeta = const VerificationMeta('lon');
  @override
  late final GeneratedColumn<double> lon = GeneratedColumn<double>(
    'lon',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _speedMeta = const VerificationMeta('speed');
  @override
  late final GeneratedColumn<double> speed = GeneratedColumn<double>(
    'speed',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _accuracyMeta = const VerificationMeta(
    'accuracy',
  );
  @override
  late final GeneratedColumn<double> accuracy = GeneratedColumn<double>(
    'accuracy',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _accelXMeta = const VerificationMeta('accelX');
  @override
  late final GeneratedColumn<double> accelX = GeneratedColumn<double>(
    'accel_x',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _accelYMeta = const VerificationMeta('accelY');
  @override
  late final GeneratedColumn<double> accelY = GeneratedColumn<double>(
    'accel_y',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _accelZMeta = const VerificationMeta('accelZ');
  @override
  late final GeneratedColumn<double> accelZ = GeneratedColumn<double>(
    'accel_z',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gyroXMeta = const VerificationMeta('gyroX');
  @override
  late final GeneratedColumn<double> gyroX = GeneratedColumn<double>(
    'gyro_x',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gyroYMeta = const VerificationMeta('gyroY');
  @override
  late final GeneratedColumn<double> gyroY = GeneratedColumn<double>(
    'gyro_y',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gyroZMeta = const VerificationMeta('gyroZ');
  @override
  late final GeneratedColumn<double> gyroZ = GeneratedColumn<double>(
    'gyro_z',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _userLabelModeMeta = const VerificationMeta(
    'userLabelMode',
  );
  @override
  late final GeneratedColumn<String> userLabelMode = GeneratedColumn<String>(
    'user_label_mode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _activityRecognitionModeMeta =
      const VerificationMeta('activityRecognitionMode');
  @override
  late final GeneratedColumn<String> activityRecognitionMode =
      GeneratedColumn<String>(
        'activity_recognition_mode',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _participantIdMeta = const VerificationMeta(
    'participantId',
  );
  @override
  late final GeneratedColumn<String> participantId = GeneratedColumn<String>(
    'participant_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _deviceModelMeta = const VerificationMeta(
    'deviceModel',
  );
  @override
  late final GeneratedColumn<String> deviceModel = GeneratedColumn<String>(
    'device_model',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _osVersionMeta = const VerificationMeta(
    'osVersion',
  );
  @override
  late final GeneratedColumn<String> osVersion = GeneratedColumn<String>(
    'os_version',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _rssiSourceMeta = const VerificationMeta(
    'rssiSource',
  );
  @override
  late final GeneratedColumn<String> rssiSource = GeneratedColumn<String>(
    'rssi_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _phonePositionMeta = const VerificationMeta(
    'phonePosition',
  );
  @override
  late final GeneratedColumn<String> phonePosition = GeneratedColumn<String>(
    'phone_position',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    tUtcMs,
    tMonoNs,
    sessionId,
    type,
    platform,
    bssid,
    ssid,
    rssiRaw,
    lat,
    lon,
    speed,
    accuracy,
    accelX,
    accelY,
    accelZ,
    gyroX,
    gyroY,
    gyroZ,
    userLabelMode,
    activityRecognitionMode,
    participantId,
    deviceModel,
    osVersion,
    rssiSource,
    phonePosition,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'event_stream';
  @override
  VerificationContext validateIntegrity(
    Insertable<EventRecord> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('t_utc_ms')) {
      context.handle(
        _tUtcMsMeta,
        tUtcMs.isAcceptableOrUnknown(data['t_utc_ms']!, _tUtcMsMeta),
      );
    } else if (isInserting) {
      context.missing(_tUtcMsMeta);
    }
    if (data.containsKey('t_mono_ns')) {
      context.handle(
        _tMonoNsMeta,
        tMonoNs.isAcceptableOrUnknown(data['t_mono_ns']!, _tMonoNsMeta),
      );
    } else if (isInserting) {
      context.missing(_tMonoNsMeta);
    }
    if (data.containsKey('session_id')) {
      context.handle(
        _sessionIdMeta,
        sessionId.isAcceptableOrUnknown(data['session_id']!, _sessionIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sessionIdMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
        _typeMeta,
        type.isAcceptableOrUnknown(data['type']!, _typeMeta),
      );
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('platform')) {
      context.handle(
        _platformMeta,
        platform.isAcceptableOrUnknown(data['platform']!, _platformMeta),
      );
    } else if (isInserting) {
      context.missing(_platformMeta);
    }
    if (data.containsKey('bssid')) {
      context.handle(
        _bssidMeta,
        bssid.isAcceptableOrUnknown(data['bssid']!, _bssidMeta),
      );
    }
    if (data.containsKey('ssid')) {
      context.handle(
        _ssidMeta,
        ssid.isAcceptableOrUnknown(data['ssid']!, _ssidMeta),
      );
    }
    if (data.containsKey('rssi_raw')) {
      context.handle(
        _rssiRawMeta,
        rssiRaw.isAcceptableOrUnknown(data['rssi_raw']!, _rssiRawMeta),
      );
    }
    if (data.containsKey('lat')) {
      context.handle(
        _latMeta,
        lat.isAcceptableOrUnknown(data['lat']!, _latMeta),
      );
    }
    if (data.containsKey('lon')) {
      context.handle(
        _lonMeta,
        lon.isAcceptableOrUnknown(data['lon']!, _lonMeta),
      );
    }
    if (data.containsKey('speed')) {
      context.handle(
        _speedMeta,
        speed.isAcceptableOrUnknown(data['speed']!, _speedMeta),
      );
    }
    if (data.containsKey('accuracy')) {
      context.handle(
        _accuracyMeta,
        accuracy.isAcceptableOrUnknown(data['accuracy']!, _accuracyMeta),
      );
    }
    if (data.containsKey('accel_x')) {
      context.handle(
        _accelXMeta,
        accelX.isAcceptableOrUnknown(data['accel_x']!, _accelXMeta),
      );
    }
    if (data.containsKey('accel_y')) {
      context.handle(
        _accelYMeta,
        accelY.isAcceptableOrUnknown(data['accel_y']!, _accelYMeta),
      );
    }
    if (data.containsKey('accel_z')) {
      context.handle(
        _accelZMeta,
        accelZ.isAcceptableOrUnknown(data['accel_z']!, _accelZMeta),
      );
    }
    if (data.containsKey('gyro_x')) {
      context.handle(
        _gyroXMeta,
        gyroX.isAcceptableOrUnknown(data['gyro_x']!, _gyroXMeta),
      );
    }
    if (data.containsKey('gyro_y')) {
      context.handle(
        _gyroYMeta,
        gyroY.isAcceptableOrUnknown(data['gyro_y']!, _gyroYMeta),
      );
    }
    if (data.containsKey('gyro_z')) {
      context.handle(
        _gyroZMeta,
        gyroZ.isAcceptableOrUnknown(data['gyro_z']!, _gyroZMeta),
      );
    }
    if (data.containsKey('user_label_mode')) {
      context.handle(
        _userLabelModeMeta,
        userLabelMode.isAcceptableOrUnknown(
          data['user_label_mode']!,
          _userLabelModeMeta,
        ),
      );
    }
    if (data.containsKey('activity_recognition_mode')) {
      context.handle(
        _activityRecognitionModeMeta,
        activityRecognitionMode.isAcceptableOrUnknown(
          data['activity_recognition_mode']!,
          _activityRecognitionModeMeta,
        ),
      );
    }
    if (data.containsKey('participant_id')) {
      context.handle(
        _participantIdMeta,
        participantId.isAcceptableOrUnknown(
          data['participant_id']!,
          _participantIdMeta,
        ),
      );
    }
    if (data.containsKey('device_model')) {
      context.handle(
        _deviceModelMeta,
        deviceModel.isAcceptableOrUnknown(
          data['device_model']!,
          _deviceModelMeta,
        ),
      );
    }
    if (data.containsKey('os_version')) {
      context.handle(
        _osVersionMeta,
        osVersion.isAcceptableOrUnknown(data['os_version']!, _osVersionMeta),
      );
    }
    if (data.containsKey('rssi_source')) {
      context.handle(
        _rssiSourceMeta,
        rssiSource.isAcceptableOrUnknown(data['rssi_source']!, _rssiSourceMeta),
      );
    }
    if (data.containsKey('phone_position')) {
      context.handle(
        _phonePositionMeta,
        phonePosition.isAcceptableOrUnknown(
          data['phone_position']!,
          _phonePositionMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  EventRecord map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return EventRecord(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      tUtcMs: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}t_utc_ms'],
      )!,
      tMonoNs: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}t_mono_ns'],
      )!,
      sessionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}session_id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}type'],
      )!,
      platform: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}platform'],
      )!,
      bssid: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bssid'],
      ),
      ssid: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ssid'],
      ),
      rssiRaw: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}rssi_raw'],
      ),
      lat: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}lat'],
      ),
      lon: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}lon'],
      ),
      speed: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}speed'],
      ),
      accuracy: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}accuracy'],
      ),
      accelX: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}accel_x'],
      ),
      accelY: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}accel_y'],
      ),
      accelZ: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}accel_z'],
      ),
      gyroX: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}gyro_x'],
      ),
      gyroY: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}gyro_y'],
      ),
      gyroZ: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}gyro_z'],
      ),
      userLabelMode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_label_mode'],
      ),
      activityRecognitionMode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}activity_recognition_mode'],
      ),
      participantId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}participant_id'],
      ),
      deviceModel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_model'],
      ),
      osVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}os_version'],
      ),
      rssiSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}rssi_source'],
      ),
      phonePosition: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone_position'],
      ),
    );
  }

  @override
  $EventStreamTable createAlias(String alias) {
    return $EventStreamTable(attachedDatabase, alias);
  }
}

class EventRecord extends DataClass implements Insertable<EventRecord> {
  final int id;
  final int tUtcMs;
  final int tMonoNs;
  final String sessionId;
  final String type;
  final String platform;
  final String? bssid;
  final String? ssid;
  final double? rssiRaw;
  final double? lat;
  final double? lon;
  final double? speed;
  final double? accuracy;
  final double? accelX;
  final double? accelY;
  final double? accelZ;
  final double? gyroX;
  final double? gyroY;
  final double? gyroZ;
  final String? userLabelMode;
  final String? activityRecognitionMode;
  final String? participantId;
  final String? deviceModel;
  final String? osVersion;
  final String? rssiSource;
  final String? phonePosition;
  const EventRecord({
    required this.id,
    required this.tUtcMs,
    required this.tMonoNs,
    required this.sessionId,
    required this.type,
    required this.platform,
    this.bssid,
    this.ssid,
    this.rssiRaw,
    this.lat,
    this.lon,
    this.speed,
    this.accuracy,
    this.accelX,
    this.accelY,
    this.accelZ,
    this.gyroX,
    this.gyroY,
    this.gyroZ,
    this.userLabelMode,
    this.activityRecognitionMode,
    this.participantId,
    this.deviceModel,
    this.osVersion,
    this.rssiSource,
    this.phonePosition,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['t_utc_ms'] = Variable<int>(tUtcMs);
    map['t_mono_ns'] = Variable<int>(tMonoNs);
    map['session_id'] = Variable<String>(sessionId);
    map['type'] = Variable<String>(type);
    map['platform'] = Variable<String>(platform);
    if (!nullToAbsent || bssid != null) {
      map['bssid'] = Variable<String>(bssid);
    }
    if (!nullToAbsent || ssid != null) {
      map['ssid'] = Variable<String>(ssid);
    }
    if (!nullToAbsent || rssiRaw != null) {
      map['rssi_raw'] = Variable<double>(rssiRaw);
    }
    if (!nullToAbsent || lat != null) {
      map['lat'] = Variable<double>(lat);
    }
    if (!nullToAbsent || lon != null) {
      map['lon'] = Variable<double>(lon);
    }
    if (!nullToAbsent || speed != null) {
      map['speed'] = Variable<double>(speed);
    }
    if (!nullToAbsent || accuracy != null) {
      map['accuracy'] = Variable<double>(accuracy);
    }
    if (!nullToAbsent || accelX != null) {
      map['accel_x'] = Variable<double>(accelX);
    }
    if (!nullToAbsent || accelY != null) {
      map['accel_y'] = Variable<double>(accelY);
    }
    if (!nullToAbsent || accelZ != null) {
      map['accel_z'] = Variable<double>(accelZ);
    }
    if (!nullToAbsent || gyroX != null) {
      map['gyro_x'] = Variable<double>(gyroX);
    }
    if (!nullToAbsent || gyroY != null) {
      map['gyro_y'] = Variable<double>(gyroY);
    }
    if (!nullToAbsent || gyroZ != null) {
      map['gyro_z'] = Variable<double>(gyroZ);
    }
    if (!nullToAbsent || userLabelMode != null) {
      map['user_label_mode'] = Variable<String>(userLabelMode);
    }
    if (!nullToAbsent || activityRecognitionMode != null) {
      map['activity_recognition_mode'] = Variable<String>(
        activityRecognitionMode,
      );
    }
    if (!nullToAbsent || participantId != null) {
      map['participant_id'] = Variable<String>(participantId);
    }
    if (!nullToAbsent || deviceModel != null) {
      map['device_model'] = Variable<String>(deviceModel);
    }
    if (!nullToAbsent || osVersion != null) {
      map['os_version'] = Variable<String>(osVersion);
    }
    if (!nullToAbsent || rssiSource != null) {
      map['rssi_source'] = Variable<String>(rssiSource);
    }
    if (!nullToAbsent || phonePosition != null) {
      map['phone_position'] = Variable<String>(phonePosition);
    }
    return map;
  }

  EventStreamCompanion toCompanion(bool nullToAbsent) {
    return EventStreamCompanion(
      id: Value(id),
      tUtcMs: Value(tUtcMs),
      tMonoNs: Value(tMonoNs),
      sessionId: Value(sessionId),
      type: Value(type),
      platform: Value(platform),
      bssid: bssid == null && nullToAbsent
          ? const Value.absent()
          : Value(bssid),
      ssid: ssid == null && nullToAbsent ? const Value.absent() : Value(ssid),
      rssiRaw: rssiRaw == null && nullToAbsent
          ? const Value.absent()
          : Value(rssiRaw),
      lat: lat == null && nullToAbsent ? const Value.absent() : Value(lat),
      lon: lon == null && nullToAbsent ? const Value.absent() : Value(lon),
      speed: speed == null && nullToAbsent
          ? const Value.absent()
          : Value(speed),
      accuracy: accuracy == null && nullToAbsent
          ? const Value.absent()
          : Value(accuracy),
      accelX: accelX == null && nullToAbsent
          ? const Value.absent()
          : Value(accelX),
      accelY: accelY == null && nullToAbsent
          ? const Value.absent()
          : Value(accelY),
      accelZ: accelZ == null && nullToAbsent
          ? const Value.absent()
          : Value(accelZ),
      gyroX: gyroX == null && nullToAbsent
          ? const Value.absent()
          : Value(gyroX),
      gyroY: gyroY == null && nullToAbsent
          ? const Value.absent()
          : Value(gyroY),
      gyroZ: gyroZ == null && nullToAbsent
          ? const Value.absent()
          : Value(gyroZ),
      userLabelMode: userLabelMode == null && nullToAbsent
          ? const Value.absent()
          : Value(userLabelMode),
      activityRecognitionMode: activityRecognitionMode == null && nullToAbsent
          ? const Value.absent()
          : Value(activityRecognitionMode),
      participantId: participantId == null && nullToAbsent
          ? const Value.absent()
          : Value(participantId),
      deviceModel: deviceModel == null && nullToAbsent
          ? const Value.absent()
          : Value(deviceModel),
      osVersion: osVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(osVersion),
      rssiSource: rssiSource == null && nullToAbsent
          ? const Value.absent()
          : Value(rssiSource),
      phonePosition: phonePosition == null && nullToAbsent
          ? const Value.absent()
          : Value(phonePosition),
    );
  }

  factory EventRecord.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return EventRecord(
      id: serializer.fromJson<int>(json['id']),
      tUtcMs: serializer.fromJson<int>(json['tUtcMs']),
      tMonoNs: serializer.fromJson<int>(json['tMonoNs']),
      sessionId: serializer.fromJson<String>(json['sessionId']),
      type: serializer.fromJson<String>(json['type']),
      platform: serializer.fromJson<String>(json['platform']),
      bssid: serializer.fromJson<String?>(json['bssid']),
      ssid: serializer.fromJson<String?>(json['ssid']),
      rssiRaw: serializer.fromJson<double?>(json['rssiRaw']),
      lat: serializer.fromJson<double?>(json['lat']),
      lon: serializer.fromJson<double?>(json['lon']),
      speed: serializer.fromJson<double?>(json['speed']),
      accuracy: serializer.fromJson<double?>(json['accuracy']),
      accelX: serializer.fromJson<double?>(json['accelX']),
      accelY: serializer.fromJson<double?>(json['accelY']),
      accelZ: serializer.fromJson<double?>(json['accelZ']),
      gyroX: serializer.fromJson<double?>(json['gyroX']),
      gyroY: serializer.fromJson<double?>(json['gyroY']),
      gyroZ: serializer.fromJson<double?>(json['gyroZ']),
      userLabelMode: serializer.fromJson<String?>(json['userLabelMode']),
      activityRecognitionMode: serializer.fromJson<String?>(
        json['activityRecognitionMode'],
      ),
      participantId: serializer.fromJson<String?>(json['participantId']),
      deviceModel: serializer.fromJson<String?>(json['deviceModel']),
      osVersion: serializer.fromJson<String?>(json['osVersion']),
      rssiSource: serializer.fromJson<String?>(json['rssiSource']),
      phonePosition: serializer.fromJson<String?>(json['phonePosition']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'tUtcMs': serializer.toJson<int>(tUtcMs),
      'tMonoNs': serializer.toJson<int>(tMonoNs),
      'sessionId': serializer.toJson<String>(sessionId),
      'type': serializer.toJson<String>(type),
      'platform': serializer.toJson<String>(platform),
      'bssid': serializer.toJson<String?>(bssid),
      'ssid': serializer.toJson<String?>(ssid),
      'rssiRaw': serializer.toJson<double?>(rssiRaw),
      'lat': serializer.toJson<double?>(lat),
      'lon': serializer.toJson<double?>(lon),
      'speed': serializer.toJson<double?>(speed),
      'accuracy': serializer.toJson<double?>(accuracy),
      'accelX': serializer.toJson<double?>(accelX),
      'accelY': serializer.toJson<double?>(accelY),
      'accelZ': serializer.toJson<double?>(accelZ),
      'gyroX': serializer.toJson<double?>(gyroX),
      'gyroY': serializer.toJson<double?>(gyroY),
      'gyroZ': serializer.toJson<double?>(gyroZ),
      'userLabelMode': serializer.toJson<String?>(userLabelMode),
      'activityRecognitionMode': serializer.toJson<String?>(
        activityRecognitionMode,
      ),
      'participantId': serializer.toJson<String?>(participantId),
      'deviceModel': serializer.toJson<String?>(deviceModel),
      'osVersion': serializer.toJson<String?>(osVersion),
      'rssiSource': serializer.toJson<String?>(rssiSource),
      'phonePosition': serializer.toJson<String?>(phonePosition),
    };
  }

  EventRecord copyWith({
    int? id,
    int? tUtcMs,
    int? tMonoNs,
    String? sessionId,
    String? type,
    String? platform,
    Value<String?> bssid = const Value.absent(),
    Value<String?> ssid = const Value.absent(),
    Value<double?> rssiRaw = const Value.absent(),
    Value<double?> lat = const Value.absent(),
    Value<double?> lon = const Value.absent(),
    Value<double?> speed = const Value.absent(),
    Value<double?> accuracy = const Value.absent(),
    Value<double?> accelX = const Value.absent(),
    Value<double?> accelY = const Value.absent(),
    Value<double?> accelZ = const Value.absent(),
    Value<double?> gyroX = const Value.absent(),
    Value<double?> gyroY = const Value.absent(),
    Value<double?> gyroZ = const Value.absent(),
    Value<String?> userLabelMode = const Value.absent(),
    Value<String?> activityRecognitionMode = const Value.absent(),
    Value<String?> participantId = const Value.absent(),
    Value<String?> deviceModel = const Value.absent(),
    Value<String?> osVersion = const Value.absent(),
    Value<String?> rssiSource = const Value.absent(),
    Value<String?> phonePosition = const Value.absent(),
  }) => EventRecord(
    id: id ?? this.id,
    tUtcMs: tUtcMs ?? this.tUtcMs,
    tMonoNs: tMonoNs ?? this.tMonoNs,
    sessionId: sessionId ?? this.sessionId,
    type: type ?? this.type,
    platform: platform ?? this.platform,
    bssid: bssid.present ? bssid.value : this.bssid,
    ssid: ssid.present ? ssid.value : this.ssid,
    rssiRaw: rssiRaw.present ? rssiRaw.value : this.rssiRaw,
    lat: lat.present ? lat.value : this.lat,
    lon: lon.present ? lon.value : this.lon,
    speed: speed.present ? speed.value : this.speed,
    accuracy: accuracy.present ? accuracy.value : this.accuracy,
    accelX: accelX.present ? accelX.value : this.accelX,
    accelY: accelY.present ? accelY.value : this.accelY,
    accelZ: accelZ.present ? accelZ.value : this.accelZ,
    gyroX: gyroX.present ? gyroX.value : this.gyroX,
    gyroY: gyroY.present ? gyroY.value : this.gyroY,
    gyroZ: gyroZ.present ? gyroZ.value : this.gyroZ,
    userLabelMode: userLabelMode.present
        ? userLabelMode.value
        : this.userLabelMode,
    activityRecognitionMode: activityRecognitionMode.present
        ? activityRecognitionMode.value
        : this.activityRecognitionMode,
    participantId: participantId.present
        ? participantId.value
        : this.participantId,
    deviceModel: deviceModel.present ? deviceModel.value : this.deviceModel,
    osVersion: osVersion.present ? osVersion.value : this.osVersion,
    rssiSource: rssiSource.present ? rssiSource.value : this.rssiSource,
    phonePosition: phonePosition.present
        ? phonePosition.value
        : this.phonePosition,
  );
  EventRecord copyWithCompanion(EventStreamCompanion data) {
    return EventRecord(
      id: data.id.present ? data.id.value : this.id,
      tUtcMs: data.tUtcMs.present ? data.tUtcMs.value : this.tUtcMs,
      tMonoNs: data.tMonoNs.present ? data.tMonoNs.value : this.tMonoNs,
      sessionId: data.sessionId.present ? data.sessionId.value : this.sessionId,
      type: data.type.present ? data.type.value : this.type,
      platform: data.platform.present ? data.platform.value : this.platform,
      bssid: data.bssid.present ? data.bssid.value : this.bssid,
      ssid: data.ssid.present ? data.ssid.value : this.ssid,
      rssiRaw: data.rssiRaw.present ? data.rssiRaw.value : this.rssiRaw,
      lat: data.lat.present ? data.lat.value : this.lat,
      lon: data.lon.present ? data.lon.value : this.lon,
      speed: data.speed.present ? data.speed.value : this.speed,
      accuracy: data.accuracy.present ? data.accuracy.value : this.accuracy,
      accelX: data.accelX.present ? data.accelX.value : this.accelX,
      accelY: data.accelY.present ? data.accelY.value : this.accelY,
      accelZ: data.accelZ.present ? data.accelZ.value : this.accelZ,
      gyroX: data.gyroX.present ? data.gyroX.value : this.gyroX,
      gyroY: data.gyroY.present ? data.gyroY.value : this.gyroY,
      gyroZ: data.gyroZ.present ? data.gyroZ.value : this.gyroZ,
      userLabelMode: data.userLabelMode.present
          ? data.userLabelMode.value
          : this.userLabelMode,
      activityRecognitionMode: data.activityRecognitionMode.present
          ? data.activityRecognitionMode.value
          : this.activityRecognitionMode,
      participantId: data.participantId.present
          ? data.participantId.value
          : this.participantId,
      deviceModel: data.deviceModel.present
          ? data.deviceModel.value
          : this.deviceModel,
      osVersion: data.osVersion.present ? data.osVersion.value : this.osVersion,
      rssiSource: data.rssiSource.present
          ? data.rssiSource.value
          : this.rssiSource,
      phonePosition: data.phonePosition.present
          ? data.phonePosition.value
          : this.phonePosition,
    );
  }

  @override
  String toString() {
    return (StringBuffer('EventRecord(')
          ..write('id: $id, ')
          ..write('tUtcMs: $tUtcMs, ')
          ..write('tMonoNs: $tMonoNs, ')
          ..write('sessionId: $sessionId, ')
          ..write('type: $type, ')
          ..write('platform: $platform, ')
          ..write('bssid: $bssid, ')
          ..write('ssid: $ssid, ')
          ..write('rssiRaw: $rssiRaw, ')
          ..write('lat: $lat, ')
          ..write('lon: $lon, ')
          ..write('speed: $speed, ')
          ..write('accuracy: $accuracy, ')
          ..write('accelX: $accelX, ')
          ..write('accelY: $accelY, ')
          ..write('accelZ: $accelZ, ')
          ..write('gyroX: $gyroX, ')
          ..write('gyroY: $gyroY, ')
          ..write('gyroZ: $gyroZ, ')
          ..write('userLabelMode: $userLabelMode, ')
          ..write('activityRecognitionMode: $activityRecognitionMode, ')
          ..write('participantId: $participantId, ')
          ..write('deviceModel: $deviceModel, ')
          ..write('osVersion: $osVersion, ')
          ..write('rssiSource: $rssiSource, ')
          ..write('phonePosition: $phonePosition')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    id,
    tUtcMs,
    tMonoNs,
    sessionId,
    type,
    platform,
    bssid,
    ssid,
    rssiRaw,
    lat,
    lon,
    speed,
    accuracy,
    accelX,
    accelY,
    accelZ,
    gyroX,
    gyroY,
    gyroZ,
    userLabelMode,
    activityRecognitionMode,
    participantId,
    deviceModel,
    osVersion,
    rssiSource,
    phonePosition,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is EventRecord &&
          other.id == this.id &&
          other.tUtcMs == this.tUtcMs &&
          other.tMonoNs == this.tMonoNs &&
          other.sessionId == this.sessionId &&
          other.type == this.type &&
          other.platform == this.platform &&
          other.bssid == this.bssid &&
          other.ssid == this.ssid &&
          other.rssiRaw == this.rssiRaw &&
          other.lat == this.lat &&
          other.lon == this.lon &&
          other.speed == this.speed &&
          other.accuracy == this.accuracy &&
          other.accelX == this.accelX &&
          other.accelY == this.accelY &&
          other.accelZ == this.accelZ &&
          other.gyroX == this.gyroX &&
          other.gyroY == this.gyroY &&
          other.gyroZ == this.gyroZ &&
          other.userLabelMode == this.userLabelMode &&
          other.activityRecognitionMode == this.activityRecognitionMode &&
          other.participantId == this.participantId &&
          other.deviceModel == this.deviceModel &&
          other.osVersion == this.osVersion &&
          other.rssiSource == this.rssiSource &&
          other.phonePosition == this.phonePosition);
}

class EventStreamCompanion extends UpdateCompanion<EventRecord> {
  final Value<int> id;
  final Value<int> tUtcMs;
  final Value<int> tMonoNs;
  final Value<String> sessionId;
  final Value<String> type;
  final Value<String> platform;
  final Value<String?> bssid;
  final Value<String?> ssid;
  final Value<double?> rssiRaw;
  final Value<double?> lat;
  final Value<double?> lon;
  final Value<double?> speed;
  final Value<double?> accuracy;
  final Value<double?> accelX;
  final Value<double?> accelY;
  final Value<double?> accelZ;
  final Value<double?> gyroX;
  final Value<double?> gyroY;
  final Value<double?> gyroZ;
  final Value<String?> userLabelMode;
  final Value<String?> activityRecognitionMode;
  final Value<String?> participantId;
  final Value<String?> deviceModel;
  final Value<String?> osVersion;
  final Value<String?> rssiSource;
  final Value<String?> phonePosition;
  const EventStreamCompanion({
    this.id = const Value.absent(),
    this.tUtcMs = const Value.absent(),
    this.tMonoNs = const Value.absent(),
    this.sessionId = const Value.absent(),
    this.type = const Value.absent(),
    this.platform = const Value.absent(),
    this.bssid = const Value.absent(),
    this.ssid = const Value.absent(),
    this.rssiRaw = const Value.absent(),
    this.lat = const Value.absent(),
    this.lon = const Value.absent(),
    this.speed = const Value.absent(),
    this.accuracy = const Value.absent(),
    this.accelX = const Value.absent(),
    this.accelY = const Value.absent(),
    this.accelZ = const Value.absent(),
    this.gyroX = const Value.absent(),
    this.gyroY = const Value.absent(),
    this.gyroZ = const Value.absent(),
    this.userLabelMode = const Value.absent(),
    this.activityRecognitionMode = const Value.absent(),
    this.participantId = const Value.absent(),
    this.deviceModel = const Value.absent(),
    this.osVersion = const Value.absent(),
    this.rssiSource = const Value.absent(),
    this.phonePosition = const Value.absent(),
  });
  EventStreamCompanion.insert({
    this.id = const Value.absent(),
    required int tUtcMs,
    required int tMonoNs,
    required String sessionId,
    required String type,
    required String platform,
    this.bssid = const Value.absent(),
    this.ssid = const Value.absent(),
    this.rssiRaw = const Value.absent(),
    this.lat = const Value.absent(),
    this.lon = const Value.absent(),
    this.speed = const Value.absent(),
    this.accuracy = const Value.absent(),
    this.accelX = const Value.absent(),
    this.accelY = const Value.absent(),
    this.accelZ = const Value.absent(),
    this.gyroX = const Value.absent(),
    this.gyroY = const Value.absent(),
    this.gyroZ = const Value.absent(),
    this.userLabelMode = const Value.absent(),
    this.activityRecognitionMode = const Value.absent(),
    this.participantId = const Value.absent(),
    this.deviceModel = const Value.absent(),
    this.osVersion = const Value.absent(),
    this.rssiSource = const Value.absent(),
    this.phonePosition = const Value.absent(),
  }) : tUtcMs = Value(tUtcMs),
       tMonoNs = Value(tMonoNs),
       sessionId = Value(sessionId),
       type = Value(type),
       platform = Value(platform);
  static Insertable<EventRecord> custom({
    Expression<int>? id,
    Expression<int>? tUtcMs,
    Expression<int>? tMonoNs,
    Expression<String>? sessionId,
    Expression<String>? type,
    Expression<String>? platform,
    Expression<String>? bssid,
    Expression<String>? ssid,
    Expression<double>? rssiRaw,
    Expression<double>? lat,
    Expression<double>? lon,
    Expression<double>? speed,
    Expression<double>? accuracy,
    Expression<double>? accelX,
    Expression<double>? accelY,
    Expression<double>? accelZ,
    Expression<double>? gyroX,
    Expression<double>? gyroY,
    Expression<double>? gyroZ,
    Expression<String>? userLabelMode,
    Expression<String>? activityRecognitionMode,
    Expression<String>? participantId,
    Expression<String>? deviceModel,
    Expression<String>? osVersion,
    Expression<String>? rssiSource,
    Expression<String>? phonePosition,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tUtcMs != null) 't_utc_ms': tUtcMs,
      if (tMonoNs != null) 't_mono_ns': tMonoNs,
      if (sessionId != null) 'session_id': sessionId,
      if (type != null) 'type': type,
      if (platform != null) 'platform': platform,
      if (bssid != null) 'bssid': bssid,
      if (ssid != null) 'ssid': ssid,
      if (rssiRaw != null) 'rssi_raw': rssiRaw,
      if (lat != null) 'lat': lat,
      if (lon != null) 'lon': lon,
      if (speed != null) 'speed': speed,
      if (accuracy != null) 'accuracy': accuracy,
      if (accelX != null) 'accel_x': accelX,
      if (accelY != null) 'accel_y': accelY,
      if (accelZ != null) 'accel_z': accelZ,
      if (gyroX != null) 'gyro_x': gyroX,
      if (gyroY != null) 'gyro_y': gyroY,
      if (gyroZ != null) 'gyro_z': gyroZ,
      if (userLabelMode != null) 'user_label_mode': userLabelMode,
      if (activityRecognitionMode != null)
        'activity_recognition_mode': activityRecognitionMode,
      if (participantId != null) 'participant_id': participantId,
      if (deviceModel != null) 'device_model': deviceModel,
      if (osVersion != null) 'os_version': osVersion,
      if (rssiSource != null) 'rssi_source': rssiSource,
      if (phonePosition != null) 'phone_position': phonePosition,
    });
  }

  EventStreamCompanion copyWith({
    Value<int>? id,
    Value<int>? tUtcMs,
    Value<int>? tMonoNs,
    Value<String>? sessionId,
    Value<String>? type,
    Value<String>? platform,
    Value<String?>? bssid,
    Value<String?>? ssid,
    Value<double?>? rssiRaw,
    Value<double?>? lat,
    Value<double?>? lon,
    Value<double?>? speed,
    Value<double?>? accuracy,
    Value<double?>? accelX,
    Value<double?>? accelY,
    Value<double?>? accelZ,
    Value<double?>? gyroX,
    Value<double?>? gyroY,
    Value<double?>? gyroZ,
    Value<String?>? userLabelMode,
    Value<String?>? activityRecognitionMode,
    Value<String?>? participantId,
    Value<String?>? deviceModel,
    Value<String?>? osVersion,
    Value<String?>? rssiSource,
    Value<String?>? phonePosition,
  }) {
    return EventStreamCompanion(
      id: id ?? this.id,
      tUtcMs: tUtcMs ?? this.tUtcMs,
      tMonoNs: tMonoNs ?? this.tMonoNs,
      sessionId: sessionId ?? this.sessionId,
      type: type ?? this.type,
      platform: platform ?? this.platform,
      bssid: bssid ?? this.bssid,
      ssid: ssid ?? this.ssid,
      rssiRaw: rssiRaw ?? this.rssiRaw,
      lat: lat ?? this.lat,
      lon: lon ?? this.lon,
      speed: speed ?? this.speed,
      accuracy: accuracy ?? this.accuracy,
      accelX: accelX ?? this.accelX,
      accelY: accelY ?? this.accelY,
      accelZ: accelZ ?? this.accelZ,
      gyroX: gyroX ?? this.gyroX,
      gyroY: gyroY ?? this.gyroY,
      gyroZ: gyroZ ?? this.gyroZ,
      userLabelMode: userLabelMode ?? this.userLabelMode,
      activityRecognitionMode:
          activityRecognitionMode ?? this.activityRecognitionMode,
      participantId: participantId ?? this.participantId,
      deviceModel: deviceModel ?? this.deviceModel,
      osVersion: osVersion ?? this.osVersion,
      rssiSource: rssiSource ?? this.rssiSource,
      phonePosition: phonePosition ?? this.phonePosition,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (tUtcMs.present) {
      map['t_utc_ms'] = Variable<int>(tUtcMs.value);
    }
    if (tMonoNs.present) {
      map['t_mono_ns'] = Variable<int>(tMonoNs.value);
    }
    if (sessionId.present) {
      map['session_id'] = Variable<String>(sessionId.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (platform.present) {
      map['platform'] = Variable<String>(platform.value);
    }
    if (bssid.present) {
      map['bssid'] = Variable<String>(bssid.value);
    }
    if (ssid.present) {
      map['ssid'] = Variable<String>(ssid.value);
    }
    if (rssiRaw.present) {
      map['rssi_raw'] = Variable<double>(rssiRaw.value);
    }
    if (lat.present) {
      map['lat'] = Variable<double>(lat.value);
    }
    if (lon.present) {
      map['lon'] = Variable<double>(lon.value);
    }
    if (speed.present) {
      map['speed'] = Variable<double>(speed.value);
    }
    if (accuracy.present) {
      map['accuracy'] = Variable<double>(accuracy.value);
    }
    if (accelX.present) {
      map['accel_x'] = Variable<double>(accelX.value);
    }
    if (accelY.present) {
      map['accel_y'] = Variable<double>(accelY.value);
    }
    if (accelZ.present) {
      map['accel_z'] = Variable<double>(accelZ.value);
    }
    if (gyroX.present) {
      map['gyro_x'] = Variable<double>(gyroX.value);
    }
    if (gyroY.present) {
      map['gyro_y'] = Variable<double>(gyroY.value);
    }
    if (gyroZ.present) {
      map['gyro_z'] = Variable<double>(gyroZ.value);
    }
    if (userLabelMode.present) {
      map['user_label_mode'] = Variable<String>(userLabelMode.value);
    }
    if (activityRecognitionMode.present) {
      map['activity_recognition_mode'] = Variable<String>(
        activityRecognitionMode.value,
      );
    }
    if (participantId.present) {
      map['participant_id'] = Variable<String>(participantId.value);
    }
    if (deviceModel.present) {
      map['device_model'] = Variable<String>(deviceModel.value);
    }
    if (osVersion.present) {
      map['os_version'] = Variable<String>(osVersion.value);
    }
    if (rssiSource.present) {
      map['rssi_source'] = Variable<String>(rssiSource.value);
    }
    if (phonePosition.present) {
      map['phone_position'] = Variable<String>(phonePosition.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('EventStreamCompanion(')
          ..write('id: $id, ')
          ..write('tUtcMs: $tUtcMs, ')
          ..write('tMonoNs: $tMonoNs, ')
          ..write('sessionId: $sessionId, ')
          ..write('type: $type, ')
          ..write('platform: $platform, ')
          ..write('bssid: $bssid, ')
          ..write('ssid: $ssid, ')
          ..write('rssiRaw: $rssiRaw, ')
          ..write('lat: $lat, ')
          ..write('lon: $lon, ')
          ..write('speed: $speed, ')
          ..write('accuracy: $accuracy, ')
          ..write('accelX: $accelX, ')
          ..write('accelY: $accelY, ')
          ..write('accelZ: $accelZ, ')
          ..write('gyroX: $gyroX, ')
          ..write('gyroY: $gyroY, ')
          ..write('gyroZ: $gyroZ, ')
          ..write('userLabelMode: $userLabelMode, ')
          ..write('activityRecognitionMode: $activityRecognitionMode, ')
          ..write('participantId: $participantId, ')
          ..write('deviceModel: $deviceModel, ')
          ..write('osVersion: $osVersion, ')
          ..write('rssiSource: $rssiSource, ')
          ..write('phonePosition: $phonePosition')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $EventStreamTable eventStream = $EventStreamTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [eventStream];
}

typedef $$EventStreamTableCreateCompanionBuilder =
    EventStreamCompanion Function({
      Value<int> id,
      required int tUtcMs,
      required int tMonoNs,
      required String sessionId,
      required String type,
      required String platform,
      Value<String?> bssid,
      Value<String?> ssid,
      Value<double?> rssiRaw,
      Value<double?> lat,
      Value<double?> lon,
      Value<double?> speed,
      Value<double?> accuracy,
      Value<double?> accelX,
      Value<double?> accelY,
      Value<double?> accelZ,
      Value<double?> gyroX,
      Value<double?> gyroY,
      Value<double?> gyroZ,
      Value<String?> userLabelMode,
      Value<String?> activityRecognitionMode,
      Value<String?> participantId,
      Value<String?> deviceModel,
      Value<String?> osVersion,
      Value<String?> rssiSource,
      Value<String?> phonePosition,
    });
typedef $$EventStreamTableUpdateCompanionBuilder =
    EventStreamCompanion Function({
      Value<int> id,
      Value<int> tUtcMs,
      Value<int> tMonoNs,
      Value<String> sessionId,
      Value<String> type,
      Value<String> platform,
      Value<String?> bssid,
      Value<String?> ssid,
      Value<double?> rssiRaw,
      Value<double?> lat,
      Value<double?> lon,
      Value<double?> speed,
      Value<double?> accuracy,
      Value<double?> accelX,
      Value<double?> accelY,
      Value<double?> accelZ,
      Value<double?> gyroX,
      Value<double?> gyroY,
      Value<double?> gyroZ,
      Value<String?> userLabelMode,
      Value<String?> activityRecognitionMode,
      Value<String?> participantId,
      Value<String?> deviceModel,
      Value<String?> osVersion,
      Value<String?> rssiSource,
      Value<String?> phonePosition,
    });

class $$EventStreamTableFilterComposer
    extends Composer<_$AppDatabase, $EventStreamTable> {
  $$EventStreamTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get tUtcMs => $composableBuilder(
    column: $table.tUtcMs,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get tMonoNs => $composableBuilder(
    column: $table.tMonoNs,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sessionId => $composableBuilder(
    column: $table.sessionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bssid => $composableBuilder(
    column: $table.bssid,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ssid => $composableBuilder(
    column: $table.ssid,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get rssiRaw => $composableBuilder(
    column: $table.rssiRaw,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get lat => $composableBuilder(
    column: $table.lat,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get lon => $composableBuilder(
    column: $table.lon,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get speed => $composableBuilder(
    column: $table.speed,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get accuracy => $composableBuilder(
    column: $table.accuracy,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get accelX => $composableBuilder(
    column: $table.accelX,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get accelY => $composableBuilder(
    column: $table.accelY,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get accelZ => $composableBuilder(
    column: $table.accelZ,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get gyroX => $composableBuilder(
    column: $table.gyroX,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get gyroY => $composableBuilder(
    column: $table.gyroY,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get gyroZ => $composableBuilder(
    column: $table.gyroZ,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userLabelMode => $composableBuilder(
    column: $table.userLabelMode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get activityRecognitionMode => $composableBuilder(
    column: $table.activityRecognitionMode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get participantId => $composableBuilder(
    column: $table.participantId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get osVersion => $composableBuilder(
    column: $table.osVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get rssiSource => $composableBuilder(
    column: $table.rssiSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phonePosition => $composableBuilder(
    column: $table.phonePosition,
    builder: (column) => ColumnFilters(column),
  );
}

class $$EventStreamTableOrderingComposer
    extends Composer<_$AppDatabase, $EventStreamTable> {
  $$EventStreamTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get tUtcMs => $composableBuilder(
    column: $table.tUtcMs,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get tMonoNs => $composableBuilder(
    column: $table.tMonoNs,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sessionId => $composableBuilder(
    column: $table.sessionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bssid => $composableBuilder(
    column: $table.bssid,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ssid => $composableBuilder(
    column: $table.ssid,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get rssiRaw => $composableBuilder(
    column: $table.rssiRaw,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get lat => $composableBuilder(
    column: $table.lat,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get lon => $composableBuilder(
    column: $table.lon,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get speed => $composableBuilder(
    column: $table.speed,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get accuracy => $composableBuilder(
    column: $table.accuracy,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get accelX => $composableBuilder(
    column: $table.accelX,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get accelY => $composableBuilder(
    column: $table.accelY,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get accelZ => $composableBuilder(
    column: $table.accelZ,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get gyroX => $composableBuilder(
    column: $table.gyroX,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get gyroY => $composableBuilder(
    column: $table.gyroY,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get gyroZ => $composableBuilder(
    column: $table.gyroZ,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userLabelMode => $composableBuilder(
    column: $table.userLabelMode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get activityRecognitionMode => $composableBuilder(
    column: $table.activityRecognitionMode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get participantId => $composableBuilder(
    column: $table.participantId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get osVersion => $composableBuilder(
    column: $table.osVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get rssiSource => $composableBuilder(
    column: $table.rssiSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phonePosition => $composableBuilder(
    column: $table.phonePosition,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$EventStreamTableAnnotationComposer
    extends Composer<_$AppDatabase, $EventStreamTable> {
  $$EventStreamTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get tUtcMs =>
      $composableBuilder(column: $table.tUtcMs, builder: (column) => column);

  GeneratedColumn<int> get tMonoNs =>
      $composableBuilder(column: $table.tMonoNs, builder: (column) => column);

  GeneratedColumn<String> get sessionId =>
      $composableBuilder(column: $table.sessionId, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get platform =>
      $composableBuilder(column: $table.platform, builder: (column) => column);

  GeneratedColumn<String> get bssid =>
      $composableBuilder(column: $table.bssid, builder: (column) => column);

  GeneratedColumn<String> get ssid =>
      $composableBuilder(column: $table.ssid, builder: (column) => column);

  GeneratedColumn<double> get rssiRaw =>
      $composableBuilder(column: $table.rssiRaw, builder: (column) => column);

  GeneratedColumn<double> get lat =>
      $composableBuilder(column: $table.lat, builder: (column) => column);

  GeneratedColumn<double> get lon =>
      $composableBuilder(column: $table.lon, builder: (column) => column);

  GeneratedColumn<double> get speed =>
      $composableBuilder(column: $table.speed, builder: (column) => column);

  GeneratedColumn<double> get accuracy =>
      $composableBuilder(column: $table.accuracy, builder: (column) => column);

  GeneratedColumn<double> get accelX =>
      $composableBuilder(column: $table.accelX, builder: (column) => column);

  GeneratedColumn<double> get accelY =>
      $composableBuilder(column: $table.accelY, builder: (column) => column);

  GeneratedColumn<double> get accelZ =>
      $composableBuilder(column: $table.accelZ, builder: (column) => column);

  GeneratedColumn<double> get gyroX =>
      $composableBuilder(column: $table.gyroX, builder: (column) => column);

  GeneratedColumn<double> get gyroY =>
      $composableBuilder(column: $table.gyroY, builder: (column) => column);

  GeneratedColumn<double> get gyroZ =>
      $composableBuilder(column: $table.gyroZ, builder: (column) => column);

  GeneratedColumn<String> get userLabelMode => $composableBuilder(
    column: $table.userLabelMode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get activityRecognitionMode => $composableBuilder(
    column: $table.activityRecognitionMode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get participantId => $composableBuilder(
    column: $table.participantId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => column,
  );

  GeneratedColumn<String> get osVersion =>
      $composableBuilder(column: $table.osVersion, builder: (column) => column);

  GeneratedColumn<String> get rssiSource => $composableBuilder(
    column: $table.rssiSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get phonePosition => $composableBuilder(
    column: $table.phonePosition,
    builder: (column) => column,
  );
}

class $$EventStreamTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $EventStreamTable,
          EventRecord,
          $$EventStreamTableFilterComposer,
          $$EventStreamTableOrderingComposer,
          $$EventStreamTableAnnotationComposer,
          $$EventStreamTableCreateCompanionBuilder,
          $$EventStreamTableUpdateCompanionBuilder,
          (
            EventRecord,
            BaseReferences<_$AppDatabase, $EventStreamTable, EventRecord>,
          ),
          EventRecord,
          PrefetchHooks Function()
        > {
  $$EventStreamTableTableManager(_$AppDatabase db, $EventStreamTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$EventStreamTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$EventStreamTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$EventStreamTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> tUtcMs = const Value.absent(),
                Value<int> tMonoNs = const Value.absent(),
                Value<String> sessionId = const Value.absent(),
                Value<String> type = const Value.absent(),
                Value<String> platform = const Value.absent(),
                Value<String?> bssid = const Value.absent(),
                Value<String?> ssid = const Value.absent(),
                Value<double?> rssiRaw = const Value.absent(),
                Value<double?> lat = const Value.absent(),
                Value<double?> lon = const Value.absent(),
                Value<double?> speed = const Value.absent(),
                Value<double?> accuracy = const Value.absent(),
                Value<double?> accelX = const Value.absent(),
                Value<double?> accelY = const Value.absent(),
                Value<double?> accelZ = const Value.absent(),
                Value<double?> gyroX = const Value.absent(),
                Value<double?> gyroY = const Value.absent(),
                Value<double?> gyroZ = const Value.absent(),
                Value<String?> userLabelMode = const Value.absent(),
                Value<String?> activityRecognitionMode = const Value.absent(),
                Value<String?> participantId = const Value.absent(),
                Value<String?> deviceModel = const Value.absent(),
                Value<String?> osVersion = const Value.absent(),
                Value<String?> rssiSource = const Value.absent(),
                Value<String?> phonePosition = const Value.absent(),
              }) => EventStreamCompanion(
                id: id,
                tUtcMs: tUtcMs,
                tMonoNs: tMonoNs,
                sessionId: sessionId,
                type: type,
                platform: platform,
                bssid: bssid,
                ssid: ssid,
                rssiRaw: rssiRaw,
                lat: lat,
                lon: lon,
                speed: speed,
                accuracy: accuracy,
                accelX: accelX,
                accelY: accelY,
                accelZ: accelZ,
                gyroX: gyroX,
                gyroY: gyroY,
                gyroZ: gyroZ,
                userLabelMode: userLabelMode,
                activityRecognitionMode: activityRecognitionMode,
                participantId: participantId,
                deviceModel: deviceModel,
                osVersion: osVersion,
                rssiSource: rssiSource,
                phonePosition: phonePosition,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int tUtcMs,
                required int tMonoNs,
                required String sessionId,
                required String type,
                required String platform,
                Value<String?> bssid = const Value.absent(),
                Value<String?> ssid = const Value.absent(),
                Value<double?> rssiRaw = const Value.absent(),
                Value<double?> lat = const Value.absent(),
                Value<double?> lon = const Value.absent(),
                Value<double?> speed = const Value.absent(),
                Value<double?> accuracy = const Value.absent(),
                Value<double?> accelX = const Value.absent(),
                Value<double?> accelY = const Value.absent(),
                Value<double?> accelZ = const Value.absent(),
                Value<double?> gyroX = const Value.absent(),
                Value<double?> gyroY = const Value.absent(),
                Value<double?> gyroZ = const Value.absent(),
                Value<String?> userLabelMode = const Value.absent(),
                Value<String?> activityRecognitionMode = const Value.absent(),
                Value<String?> participantId = const Value.absent(),
                Value<String?> deviceModel = const Value.absent(),
                Value<String?> osVersion = const Value.absent(),
                Value<String?> rssiSource = const Value.absent(),
                Value<String?> phonePosition = const Value.absent(),
              }) => EventStreamCompanion.insert(
                id: id,
                tUtcMs: tUtcMs,
                tMonoNs: tMonoNs,
                sessionId: sessionId,
                type: type,
                platform: platform,
                bssid: bssid,
                ssid: ssid,
                rssiRaw: rssiRaw,
                lat: lat,
                lon: lon,
                speed: speed,
                accuracy: accuracy,
                accelX: accelX,
                accelY: accelY,
                accelZ: accelZ,
                gyroX: gyroX,
                gyroY: gyroY,
                gyroZ: gyroZ,
                userLabelMode: userLabelMode,
                activityRecognitionMode: activityRecognitionMode,
                participantId: participantId,
                deviceModel: deviceModel,
                osVersion: osVersion,
                rssiSource: rssiSource,
                phonePosition: phonePosition,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$EventStreamTable, EventRecord>(table),
                  BaseReferences<_$AppDatabase, $EventStreamTable, EventRecord>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$EventStreamTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $EventStreamTable,
      EventRecord,
      $$EventStreamTableFilterComposer,
      $$EventStreamTableOrderingComposer,
      $$EventStreamTableAnnotationComposer,
      $$EventStreamTableCreateCompanionBuilder,
      $$EventStreamTableUpdateCompanionBuilder,
      (
        EventRecord,
        BaseReferences<_$AppDatabase, $EventStreamTable, EventRecord>,
      ),
      EventRecord,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$EventStreamTableTableManager get eventStream =>
      $$EventStreamTableTableManager(_db, _db.eventStream);
}

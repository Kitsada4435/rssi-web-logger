let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  const headers = [
    't_utc_ms',
    't_mono_ns',
    'timestamp',
    'session_id',
    'participant_id',
    'platform',
    'device_model',
    'os_version',
    'lat',
    'lon',
    'altitude',
    'heading',
    'speed',
    'accuracy',
    'accel_x',
    'accel_y',
    'accel_z',
    'gyro_x',
    'gyro_y',
    'gyro_z',
    'attitude',
    'bssid',
    'ssid',
    'rssi_raw',
    'rssi_source',
    'user_label_mode',
    'activity_recognition_mode',
    'phone_position',
    'note'
  ];
  let csv = headers.join(',') + '\n';
  memoryStore.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    const line = [
      tUtc,
      row.t_mono_ns !== null && row.t_mono_ns !== undefined ? row.t_mono_ns : '',
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || '',
      row.participant_id || '',
      row.platform || 'web',
      `"${(row.device_model || '').replace(/"/g, '""')}"`,
      `"${(row.os_version || '').replace(/"/g, '""')}"`,
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ''),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ''),
      row.altitude !== null && row.altitude !== undefined ? row.altitude : '',
      row.heading !== null && row.heading !== undefined ? row.heading : '',
      row.speed !== null && row.speed !== undefined ? row.speed : '',
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : '',
      row.accel_x !== null && row.accel_x !== undefined ? row.accel_x : '',
      row.accel_y !== null && row.accel_y !== undefined ? row.accel_y : '',
      row.accel_z !== null && row.accel_z !== undefined ? row.accel_z : '',
      row.gyro_x !== null && row.gyro_x !== undefined ? row.gyro_x : '',
      row.gyro_y !== null && row.gyro_y !== undefined ? row.gyro_y : '',
      row.gyro_z !== null && row.gyro_z !== undefined ? row.gyro_z : '',
      `"${(row.attitude || '').replace(/"/g, '""')}"`,
      row.bssid || '',
      `"${(row.ssid || '').replace(/"/g, '""')}"`,
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ''),
      row.rssi_source || 'web_telemetry',
      row.user_label_mode || 'walk',
      row.activity_recognition_mode || row.predicted_mode || 'still',
      row.phone_position || 'pocket',
      `"${(row.note || '').replace(/"/g, '""')}"`
    ];
    csv += line.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="rssi_logs_${Date.now()}.csv"`);
  res.status(200).send(csv);
};

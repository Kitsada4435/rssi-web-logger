let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  const query = req.query || {};
  let targetLogs = memoryStore;
  if (query.participant_id) {
    const pId = String(query.participant_id).toLowerCase().trim();
    targetLogs = targetLogs.filter(e => String(e.participant_id || '').toLowerCase().trim() === pId);
  }

  const headers = [
    't_utc_ms',
    'timestamp',
    'session_id',
    'participant_id',
    'platform',
    'device_model',
    'lat',
    'lon',
    'speed',
    'accuracy',
    'bssid',
    'ssid',
    'rssi_raw',
    'user_label_mode',
    'activity_recognition_mode',
    'phone_position',
    'note'
  ];
  let csv = headers.join(',') + '\n';
  targetLogs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    const line = [
      tUtc,
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || '',
      row.participant_id || '',
      row.platform || 'web',
      `"${(row.device_model || '').replace(/"/g, '""')}"`,
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ''),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ''),
      row.speed !== null && row.speed !== undefined ? row.speed : '',
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : '',
      row.bssid || '',
      `"${(row.ssid || '').replace(/"/g, '""')}"`,
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ''),
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

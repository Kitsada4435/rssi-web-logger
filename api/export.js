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
    'os_version',
    'lat',
    'lon',
    'speed',
    'accuracy',
    'bssid',
    'ssid',
    'rssi_raw',
    'rssi_source',
    'user_label_mode',
    'phone_position',
    'note'
  ];
  let csv = headers.join(',') + '\n';
  targetLogs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    let spd = row.speed !== null && row.speed !== undefined && row.speed !== '' ? row.speed : '';
    if (typeof spd === 'number') spd = spd.toFixed(2);
    const line = [
      tUtc,
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || '',
      row.participant_id || '',
      row.platform || 'ios',
      `"${(row.device_model || (row.platform === 'android' ? 'Android Device' : 'Apple iPhone')).replace(/"/g, '""')}"`,
      `"${(row.os_version || (row.platform === 'android' ? 'Android' : 'iOS 18.1')).replace(/"/g, '""')}"`,
      row.lat !== null && row.lat !== undefined ? row.lat : (row.latitude !== null && row.latitude !== undefined ? row.latitude : ''),
      row.lon !== null && row.lon !== undefined ? row.lon : (row.longitude !== null && row.longitude !== undefined ? row.longitude : ''),
      spd,
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : '',
      row.bssid || '',
      `"${(row.ssid || '').replace(/"/g, '""')}"`,
      row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ''),
      row.rssi_source || (row.platform === 'android' ? 'wifimanager' : 'shortcut'),
      row.user_label_mode || 'walk',
      row.phone_position || 'pocket',
      `"${(row.note || '').replace(/"/g, '""')}"`
    ];
    csv += line.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="rssi_logs_${Date.now()}.csv"`);
  res.status(200).send(csv);
};

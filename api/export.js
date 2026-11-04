let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  const headers = ['timestamp','participant_id','trip_id','latitude','longitude','altitude','heading','accuracy','speed','ssid','bssid','rssi','user_label_mode','predicted_mode','attitude','note'];
  let csv = headers.join(',') + '\n';
  memoryStore.forEach(row => {
    const line = [
      row.timestamp,
      row.participant_id,
      row.trip_id,
      row.latitude !== null && row.latitude !== undefined ? row.latitude : '',
      row.longitude !== null && row.longitude !== undefined ? row.longitude : '',
      row.altitude !== null && row.altitude !== undefined ? row.altitude : '',
      row.heading !== null && row.heading !== undefined ? row.heading : '',
      row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : '',
      row.speed !== null && row.speed !== undefined ? row.speed : '',
      `"${(row.ssid || '').replace(/"/g, '""')}"`,
      row.bssid || '',
      row.rssi !== null && row.rssi !== undefined ? row.rssi : '',
      row.user_label_mode || 'walk',
      row.predicted_mode || '',
      `"${(row.attitude || '').replace(/"/g, '""')}"`,
      `"${(row.note || '').replace(/"/g, '""')}"`
    ];
    csv += line.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="rssi_logs_${Date.now()}.csv"`);
  res.status(200).send(csv);
};

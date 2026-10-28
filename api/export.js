let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  const headers = ['timestamp','participant_id','trip_id','latitude','longitude','accuracy','speed','ssid','bssid','rssi','user_label_mode'];
  let csv = headers.join(',') + '\n';
  memoryStore.forEach(row => {
    const line = [
      row.timestamp,
      row.participant_id,
      row.trip_id,
      row.latitude !== null ? row.latitude : '',
      row.longitude !== null ? row.longitude : '',
      row.accuracy !== null ? row.accuracy : '',
      row.speed !== null ? row.speed : '',
      `"${(row.ssid || '').replace(/"/g, '""')}"`,
      row.bssid,
      row.rssi,
      row.user_label_mode
    ];
    csv += line.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="rssi_logs_${Date.now()}.csv"`);
  res.status(200).send(csv);
};

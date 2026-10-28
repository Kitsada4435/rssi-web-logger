let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.method === 'GET' ? req.query : { ...req.query, ...req.body };
  
  const bssid = query.bssid || query.bssi || 'unknown';
  const ssid = query.ssid || query.ssi || 'unknown';
  const rssi = query.rssi !== undefined ? parseInt(query.rssi, 10) : null;
  const lat = query.lat || query.latitude ? parseFloat(query.lat || query.latitude) : null;
  const lng = query.lng || query.lon || query.longitude ? parseFloat(query.lng || query.lon || query.longitude) : null;
  const speed = query.speed ? parseFloat(query.speed) : 0.0;
  const accuracy = query.accuracy ? parseFloat(query.accuracy) : 5.0;
  const mode = query.mode || query.user_label_mode || 'walk';
  const participantId = query.participant_id ? decodeURIComponent(query.participant_id).trim() : 'USR-ANON';
  const tripId = query.trip_id || 'TRIP-DEFAULT';

  const entry = {
    id: memoryStore.length + 1,
    timestamp: new Date().toISOString(),
    participant_id: participantId,
    trip_id: tripId,
    bssid: bssid,
    ssid: ssid,
    rssi: isNaN(rssi) ? -99 : rssi,
    latitude: lat,
    longitude: lng,
    speed: speed,
    accuracy: accuracy,
    user_label_mode: mode
  };

  memoryStore.push(entry);
  if (memoryStore.length > 5000) memoryStore.shift();

  res.status(200).json({ status: 'ok', count: memoryStore.length, entry });
};

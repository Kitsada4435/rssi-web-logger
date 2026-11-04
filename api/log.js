const fs = require('fs');
const path = require('path');

const TMP_FILE = path.join('/tmp', 'rssi_store.json');

// In-Memory store with /tmp persistence for serverless reliability
let memoryStore = global._rssiMemoryStore || [];
if (memoryStore.length === 0) {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const saved = fs.readFileSync(TMP_FILE, 'utf8');
      if (saved) memoryStore = JSON.parse(saved);
    }
  } catch (e) {}
}
global._rssiMemoryStore = memoryStore;

function persistStore() {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(memoryStore));
  } catch (e) {}
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Handle Clear / Delete Action
  if (req.method === 'DELETE' || (req.query && req.query.action === 'clear')) {
    memoryStore = [];
    global._rssiMemoryStore = memoryStore;
    persistStore();
    return res.status(200).json({ status: 'ok', message: 'Cleared' });
  }

  const rawQuery = req.method === 'GET' ? req.query : { ...req.query, ...req.body };
  const query = {};
  for (const [k, v] of Object.entries(rawQuery || {})) {
    query[k.trim().toLowerCase()] = typeof v === 'string' ? v.trim() : v;
  }

  const hasTelemetry = query.bssid || query.ssid || query.rssi !== undefined;
  const isLogsUrl = (req.url && (req.url.includes('/api/logs') || req.url.includes('/api/stream'))) || query.action === 'get';

  // 2. Handle Fetching Logs (Polled by Web Dashboard)
  if (isLogsUrl || (req.method === 'GET' && !hasTelemetry && req.headers.accept && !req.headers.accept.includes('text/html'))) {
    return res.status(200).json({
      status: 'ok',
      count: memoryStore.length,
      logs: memoryStore
    });
  }

  // 3. Handle Web Browser Visiting in Tab Directly (Redirect to Dashboard)
  const isBrowserHtml = req.headers && req.headers.accept && req.headers.accept.includes('text/html');
  if (req.method === 'GET' && isBrowserHtml) {
    if (hasTelemetry) {
      recordTelemetry(query);
    }
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // 4. Ingest Telemetry Entry (From Apple Shortcuts / Android Companion / Simulator)
  const entry = recordTelemetry(query);

  // Background forward to Google Drive if configured
  const gdriveWebhook = query.gdrive_webhook || process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  if (gdriveWebhook) {
    try {
      fetch(gdriveWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(err => console.error('Google Drive forward error:', err.message));
    } catch (e) {}
  }

  res.status(200).json({ status: 'ok', count: memoryStore.length, entry });
};

function recordTelemetry(query) {
  const bssid = query.bssid || query.bssi || 'unknown';
  const ssid = query.ssid || query.ssi || 'unknown';
  const rawRssi = query.rssi_raw !== undefined ? query.rssi_raw : query.rssi;
  const rssi = rawRssi !== undefined && rawRssi !== '' ? parseFloat(rawRssi) : -99;
  const lat = query.lat !== undefined ? parseFloat(query.lat) : (query.latitude !== undefined ? parseFloat(query.latitude) : null);
  const lon = query.lon !== undefined ? parseFloat(query.lon) : (query.lng !== undefined ? parseFloat(query.lng) : (query.longitude !== undefined ? parseFloat(query.longitude) : null));
  const speed = query.speed !== undefined && query.speed !== '' ? parseFloat(query.speed) : 0.0;
  const accuracy = query.accuracy !== undefined && query.accuracy !== '' ? parseFloat(query.accuracy) : 5.0;
  const mode = query.user_label_mode || query.mode || 'walk';
  const participantId = query.participant_id ? decodeURIComponent(query.participant_id).trim() : 'USR-ANON';
  const tripId = query.session_id || query.trip_id || 'TRIP-DEFAULT';
  const note = query.note || query.notes || query.location_note || '';

  // Timing
  const tUtcMs = query.t_utc_ms ? parseInt(query.t_utc_ms, 10) : Date.now();
  const tMonoNs = query.t_mono_ns ? parseInt(query.t_mono_ns, 10) : null;

  // Platform & Hardware metadata
  const platform = query.platform || 'web';
  const deviceModel = query.device_model || query.devicemodel || 'Unknown-Device';
  const osVersion = query.os_version || query.osversion || 'Web';

  // Kinematics & Orientation (Altitude, Heading, Attitude)
  const rawAlt = query.altitude !== undefined ? query.altitude : query.alt;
  const altitude = rawAlt !== undefined && rawAlt !== '' ? parseFloat(rawAlt) : null;

  const rawHeading = query.heading !== undefined ? query.heading : query.bearing;
  const heading = rawHeading !== undefined && rawHeading !== '' ? parseFloat(rawHeading) : null;

  let attitude = query.attitude || '';
  if (!attitude && (query.pitch !== undefined || query.roll !== undefined)) {
    attitude = `P:${query.pitch || 0}/R:${query.roll || 0}`;
  }

  // Raw IMU 6-axis (Accelerometer + Gyroscope)
  const accelX = query.accel_x !== undefined && query.accel_x !== '' ? parseFloat(query.accel_x) : null;
  const accelY = query.accel_y !== undefined && query.accel_y !== '' ? parseFloat(query.accel_y) : null;
  const accelZ = query.accel_z !== undefined && query.accel_z !== '' ? parseFloat(query.accel_z) : null;

  const gyroX = query.gyro_x !== undefined && query.gyro_x !== '' ? parseFloat(query.gyro_x) : null;
  const gyroY = query.gyro_y !== undefined && query.gyro_y !== '' ? parseFloat(query.gyro_y) : null;
  const gyroZ = query.gyro_z !== undefined && query.gyro_z !== '' ? parseFloat(query.gyro_z) : null;

  // Phone Position
  const phonePosition = query.phone_position || 'pocket';

  // RSSI source
  const rssiSource = query.rssi_source || (platform === 'android' ? 'wifimanager' : 'apple_shortcut');

  // Predicted Motion Mode (Activity recognition from mobile or speed heuristic)
  let predictedMode = query.activity_recognition_mode || query.predicted_mode || query.activity || query.motion || null;
  if (!predictedMode) {
    if (speed < 0.3) predictedMode = 'still';
    else if (speed <= 1.8) predictedMode = 'walk';
    else if (speed <= 5.0) predictedMode = 'run';
    else predictedMode = 'vehicle';
  }

  const entry = {
    id: memoryStore.length + 1,
    t_utc_ms: tUtcMs,
    t_mono_ns: tMonoNs,
    timestamp: new Date(tUtcMs).toISOString(),
    session_id: tripId,
    trip_id: tripId,
    participant_id: participantId,
    platform: platform,
    device_model: deviceModel,
    os_version: osVersion,
    lat: lat,
    lon: lon,
    latitude: lat,
    longitude: lon,
    altitude: isNaN(altitude) ? null : altitude,
    heading: isNaN(heading) ? null : heading,
    speed: speed,
    accuracy: accuracy,
    accel_x: accelX,
    accel_y: accelY,
    accel_z: accelZ,
    gyro_x: gyroX,
    gyro_y: gyroY,
    gyro_z: gyroZ,
    attitude: attitude,
    bssid: bssid,
    ssid: ssid,
    rssi_raw: rssi,
    rssi: Math.round(rssi),
    rssi_source: rssiSource,
    user_label_mode: mode,
    activity_recognition_mode: predictedMode,
    predicted_mode: predictedMode,
    phone_position: phonePosition,
    note: note
  };

  memoryStore.push(entry);
  if (memoryStore.length > 5000) memoryStore.shift();
  persistStore();
  return entry;
}

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
  const rssi = query.rssi !== undefined ? parseInt(query.rssi, 10) : null;
  const lat = query.lat || query.latitude ? parseFloat(query.lat || query.latitude) : null;
  const lng = query.lng || query.lon || query.longitude ? parseFloat(query.lng || query.lon || query.longitude) : null;
  const speed = query.speed ? parseFloat(query.speed) : 0.0;
  const accuracy = query.accuracy ? parseFloat(query.accuracy) : 5.0;
  const mode = query.mode || query.user_label_mode || 'walk';
  const participantId = query.participant_id ? decodeURIComponent(query.participant_id).trim() : 'USR-ANON';
  const tripId = query.trip_id || 'TRIP-DEFAULT';
  const note = query.note || query.notes || query.location_note || '';

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
    user_label_mode: mode,
    note: note
  };

  memoryStore.push(entry);
  if (memoryStore.length > 5000) memoryStore.shift();
  persistStore();
  return entry;
}

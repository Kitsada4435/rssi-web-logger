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

  const rawQuery = req.method === 'GET' ? req.query : { ...req.query, ...req.body };
  const query = {};
  for (const [k, v] of Object.entries(rawQuery || {})) {
    query[k.trim().toLowerCase()] = typeof v === 'string' ? v.trim() : v;
  }

  // 1. Handle Clear / Delete Action (Strict Isolation per participant)
  if (req.method === 'DELETE' || query.action === 'clear') {
    const targetParticipant = query.participant_id ? String(query.participant_id).toLowerCase().trim() : null;
    if (targetParticipant) {
      memoryStore = memoryStore.filter(e => String(e.participant_id || '').toLowerCase().trim() !== targetParticipant);
    } else {
      memoryStore = [];
    }
    global._rssiMemoryStore = memoryStore;
    persistStore();
    return res.status(200).json({ status: 'ok', message: targetParticipant ? `Cleared for ${targetParticipant}` : 'Cleared all' });
  }

  const hasTelemetry = query.bssid || query.ssid || query.rssi !== undefined || query.rssi_raw !== undefined;
  const isLogsUrl = (req.url && (req.url.includes('/api/logs') || req.url.includes('/api/stream'))) || query.action === 'get';

  // 2. Handle Fetching Logs (Polled by Web Dashboard with Strict Multi-User Isolation)
  if (isLogsUrl || (req.method === 'GET' && !hasTelemetry && req.headers.accept && !req.headers.accept.includes('text/html'))) {
    let filteredLogs = memoryStore;

    const userAgent = (req && req.headers && req.headers['user-agent']) || '';
    const isIosPoll = query.platform === 'ios' || /iPhone|iPad|iPod/i.test(userAgent);

    // Strict participant filter: Each client receives packets for their device ID (and fallback for iOS/iPhone/anon)
    if (query.participant_id) {
      const pId = String(query.participant_id).toLowerCase().trim();
      filteredLogs = filteredLogs.filter(e => {
        const ePid = String(e.participant_id || '').toLowerCase().trim();
        if (ePid === pId) return true;
        if (isIosPoll && (ePid === 'iphone' || ePid === 'usr-anon' || ePid.startsWith('ios-'))) return true;
        return false;
      });
    } else {
      // Reject polling without participant_id to prevent leaking other participants' data
      filteredLogs = [];
    }

    if (query.after_id !== undefined && query.after_id !== '') {
      const afterId = parseInt(query.after_id, 10);
      if (!isNaN(afterId)) {
        filteredLogs = filteredLogs.filter(e => e.id > afterId);
      }
    }

    const recentSenders = [...new Set(memoryStore.slice(-20).map(e => e.participant_id).filter(Boolean))];

    return res.status(200).json({
      status: 'ok',
      count: filteredLogs.length,
      logs: filteredLogs,
      recent_senders: recentSenders
    });
  }

  // 3. Handle Web Browser Visiting in Tab Directly (Redirect to Dashboard)
  const isBrowserHtml = req.headers && req.headers.accept && req.headers.accept.includes('text/html');
  if (req.method === 'GET' && isBrowserHtml) {
    if (hasTelemetry) {
      recordTelemetry(query, req);
    }
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // 4. Ingest Telemetry Entry (From Apple Shortcuts / Android Companion / Simulator)
  const entry = recordTelemetry(query, req);

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

function recordTelemetry(query, req) {
  const bssid = query.bssid || query.bssi || 'unknown';
  const ssid = query.ssid || query.ssi || 'unknown';
  const rawRssi = query.rssi_raw !== undefined ? query.rssi_raw : query.rssi;
  const rssi = rawRssi !== undefined && rawRssi !== '' ? parseFloat(rawRssi) : -99;
  const lat = query.lat !== undefined ? parseFloat(query.lat) : (query.latitude !== undefined ? parseFloat(query.latitude) : null);
  const lon = query.lon !== undefined ? parseFloat(query.lon) : (query.lng !== undefined ? parseFloat(query.lng) : (query.longitude !== undefined ? parseFloat(query.longitude) : null));
  const speed = query.speed !== undefined && query.speed !== '' ? parseFloat(query.speed) : 0.0;
  const accuracy = query.accuracy !== undefined && query.accuracy !== '' ? parseFloat(query.accuracy) : 5.0;
  const mode = query.user_label_mode || query.mode || 'walk';
  const participantId = query.participant_id ? decodeURIComponent(query.participant_id).trim() : (query.id ? decodeURIComponent(query.id).trim() : (query.device_id ? decodeURIComponent(query.device_id).trim() : 'USR-ANON'));
  const tripId = (query.session_id && query.session_id !== 'TRIP-DEFAULT') ? query.session_id : ((query.trip_id && query.trip_id !== 'TRIP-DEFAULT') ? query.trip_id : '');
  const note = query.note || query.notes || query.location_note || '';

  // Timing
  const tUtcMs = query.t_utc_ms ? parseInt(query.t_utc_ms, 10) : Date.now();

  // Platform & Hardware metadata detection
  const userAgent = (req && req.headers && req.headers['user-agent']) || '';
  const isIos = query.platform === 'ios' || /iPhone|iPad|iPod|Shortcuts|Darwin|CFNetwork/i.test(userAgent) || /iphone|ios/i.test(participantId);
  const isAndroid = query.platform === 'android' || /Android/i.test(userAgent);

  const platform = query.platform || (isAndroid ? 'android' : 'ios');
  const deviceModel = query.device_model || query.devicemodel || (platform === 'android' ? 'Android Device' : 'Apple iPhone');
  const osVersion = query.os_version || (platform === 'android' ? 'Android' : 'iOS 18.1');
  const rssiSource = query.rssi_source || (platform === 'android' ? 'wifimanager' : 'shortcut');

  let formattedSpeed = speed;
  if (typeof formattedSpeed === 'number' && !isNaN(formattedSpeed)) {
    formattedSpeed = parseFloat(formattedSpeed.toFixed(2));
  }

  // Phone Position
  const phonePosition = query.phone_position || 'pocket';

  const entry = {
    id: memoryStore.length + 1,
    t_utc_ms: tUtcMs,
    timestamp: new Date(tUtcMs).toISOString(),
    session_id: tripId,
    participant_id: participantId,
    platform: platform,
    device_model: deviceModel,
    os_version: osVersion,
    lat: lat,
    lon: lon,
    speed: formattedSpeed,
    accuracy: accuracy,
    bssid: bssid,
    ssid: ssid,
    rssi_raw: rssi,
    rssi_source: rssiSource,
    user_label_mode: mode,
    phone_position: phonePosition,
    note: note,
    trip_id: tripId,
    latitude: lat,
    longitude: lon,
    rssi: Math.round(rssi)
  };

  memoryStore.push(entry);
  if (memoryStore.length > 20000) {
    const cutoff = Date.now() - (2 * 60 * 60 * 1000);
    memoryStore = memoryStore.filter(e => (e.t_utc_ms || 0) > cutoff);
    if (memoryStore.length > 25000) memoryStore.splice(0, memoryStore.length - 20000);
    global._rssiMemoryStore = memoryStore;
  }
  persistStore();
  return entry;
}

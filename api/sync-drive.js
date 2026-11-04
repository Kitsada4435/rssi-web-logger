const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzvkcibz8OjhTj8pgQE2BhkNy3S6cSEt9OlDFdfJ261-CFzpHX6pSU66IeEtqkh9Q7e/exec';

function generateCsvString(logs, participantId, tripId) {
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
  logs.forEach(row => {
    const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
    let spd = row.speed !== null && row.speed !== undefined && row.speed !== '' ? row.speed : '';
    if (typeof spd === 'number') spd = spd.toFixed(2);
    const line = [
      tUtc,
      row.timestamp || new Date(tUtc).toISOString(),
      row.session_id || row.trip_id || tripId,
      row.participant_id || participantId,
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
  return csv;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { logs, trip_id, participant_id, webhook_url, os, device_model } = req.body || {};
  const targetWebhook = webhook_url || process.env.GOOGLE_DRIVE_WEBHOOK_URL || DEFAULT_GAS_URL;

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    res.status(400).json({ status: 'error', message: 'No logs to sync' });
    return;
  }

  const cleanParticipantId = participant_id || 'USR-ANON';
  const cleanTripId = trip_id || `TRIP_${Date.now()}`;
  const csvContent = generateCsvString(logs, cleanParticipantId, cleanTripId);
  const base64Content = Buffer.from(csvContent, 'utf-8').toString('base64');
  const filename = `${cleanParticipantId}_${cleanTripId}.csv`;

  // Dual payload: Compatible with BOTH old Application GAS script and new Sheet GAS script
  const payload = {
    // Old GAS Script parameters (from RSSI GPS Application)
    filename: filename,
    content: base64Content,
    os: os || (logs[0] && logs[0].platform) || 'ios',
    deviceModel: device_model || (logs[0] && logs[0].device_model) || (os === 'android' ? 'Android Device' : 'Apple iPhone'),
    participantId: cleanParticipantId,

    // New GAS Script parameters (for Google Sheets real-time)
    action: 'batch_upload',
    trip_id: cleanTripId,
    save_csv: true,
    logs: logs
  };

  try {
    const response = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = { status: 'success', raw: text };
    }

    res.status(200).json({ status: 'ok', google_response: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

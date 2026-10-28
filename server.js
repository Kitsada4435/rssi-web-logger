const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Telemetry Storage
let logs = [];
let clients = [];

// Helper: Broadcast event to all SSE connected dashboard clients
function broadcast(event, data) {
  clients.forEach(client => {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

// 1. Ingest Log Endpoint (Supports both GET & POST from Apple Shortcuts)
app.all('/api/log', (req, res) => {
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
    id: logs.length + 1,
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

  logs.push(entry);
  if (logs.length > 10000) logs.shift(); // keep memory footprint optimal

  // Real-time broadcast to dashboard clients
  broadcast('log', entry);

  res.status(200).json({ status: 'ok', count: logs.length, entry });
});

// 2. SSE Real-Time Stream Endpoint
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// 3. Get Logs
app.get('/api/logs', (req, res) => {
  res.json({ status: 'ok', count: logs.length, logs });
});

// 4. Clear Session Logs
app.delete('/api/clear', (req, res) => {
  logs = [];
  broadcast('clear', { status: 'cleared' });
  res.json({ status: 'ok', message: 'Logs cleared successfully' });
});

// 5. CSV Export Endpoint
app.get('/api/export', (req, res) => {
  const headers = [
    'timestamp',
    'participant_id',
    'trip_id',
    'latitude',
    'longitude',
    'accuracy',
    'speed',
    'ssid',
    'bssid',
    'rssi',
    'user_label_mode'
  ];

  let csv = headers.join(',') + '\n';
  logs.forEach(row => {
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
  res.send(csv);
});

// Fallback to SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`📡 RSSI Web Logger Server running on port ${PORT}`);
  console.log(`🌐 Local URL:   http://localhost:${PORT}`);
  console.log(`📲 Ingest API:  http://localhost:${PORT}/api/log`);
  console.log(`===============================================`);
});

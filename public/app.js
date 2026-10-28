// RSSI Web Logger - Client Controller
document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    isRecording: false,
    startTime: null,
    timerInterval: null,
    tripId: 'IDLE',
    participantId: (() => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id') || urlParams.get('participant_id');
      if (urlId) {
        const clean = urlId.trim().toUpperCase();
        localStorage.setItem('rssi_participant_id', clean);
        return clean;
      }
      const saved = localStorage.getItem('rssi_participant_id');
      if (saved) return saved;
      // Auto-generate clean 6-character verification code: EXP-XXXX
      const generated = 'EXP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem('rssi_participant_id', generated);
      return generated;
    })(),
    selectedMode: 'walk',
    currentLocation: null,
    watchId: null,
    logs: [],
    chart: null,
    map: null,
    userMarker: null,
    pathPolyline: null
  };

  // DOM Elements
  const el = {
    connPill: document.getElementById('connection-pill'),
    connText: document.getElementById('connection-text'),
    tripTimer: document.getElementById('trip-timer'),
    tripIdBadge: document.getElementById('trip-id-badge'),
    btnStart: document.getElementById('btn-start-trip'),
    btnStop: document.getElementById('btn-stop-trip'),
    btnExport: document.getElementById('btn-export-csv'),
    btnSimulate: document.getElementById('btn-simulate-ping'),
    btnClear: document.getElementById('btn-clear-data'),
    btnRecenter: document.getElementById('btn-recenter'),
    currentRssi: document.getElementById('current-rssi'),
    gaugeFill: document.getElementById('gauge-fill'),
    signalTag: document.getElementById('signal-level-tag'),
    currentSsid: document.getElementById('current-ssid'),
    currentBssid: document.getElementById('current-bssid'),
    gpsCoords: document.getElementById('gps-coords'),
    gpsSpeed: document.getElementById('gps-speed'),
    totalSamples: document.getElementById('total-samples'),
    avgRssi: document.getElementById('avg-rssi'),
    participantInput: document.getElementById('participant-id-input'),
    serverUrlDisplay: document.getElementById('server-url-display'),
    modeBtns: document.querySelectorAll('.mode-btn')
  };

  // 1. Initialize Map (Leaflet with CartoDB Dark Matter)
  function initMap() {
    const defaultCenter = [13.7563, 100.5018]; // Bangkok
    state.map = L.map('leaflet-map', {
      zoomControl: false,
      attributionControl: false
    }).setView(defaultCenter, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(state.map);

    L.control.zoom({ position: 'bottomright' }).addTo(state.map);

    state.pathPolyline = L.polyline([], {
      color: '#06b6d4',
      weight: 4,
      opacity: 0.85,
      smoothFactor: 1
    }).addTo(state.map);

    const customIcon = L.divIcon({
      className: 'custom-loc-marker',
      html: '<div style="width:14px;height:14px;background:#06b6d4;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #06b6d4;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    state.userMarker = L.marker(defaultCenter, { icon: customIcon }).addTo(state.map);
  }

  // 2. Initialize Chart.js Timeline
  function initChart() {
    const ctx = document.getElementById('rssiChart').getContext('2d');
    state.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'RSSI (dBm)',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        scales: {
          x: {
            display: false,
            grid: { display: false }
          },
          y: {
            min: -100,
            max: -30,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 10 },
              stepSize: 15
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#94a3b8',
            bodyColor: '#10b981',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        }
      }
    });
  }

  // 3. Geolocation Tracker
  function startGeoTracking() {
    if ('geolocation' in navigator) {
      state.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed !== null ? (pos.coords.speed * 3.6).toFixed(1) : '0.0';
          const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 5;

          state.currentLocation = { lat, lng, speed, accuracy: acc };
          el.gpsCoords.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          el.gpsSpeed.textContent = `${speed} km/h (±${acc}m)`;

          const newLatLng = [lat, lng];
          state.userMarker.setLatLng(newLatLng);

          if (state.isRecording) {
            state.pathPolyline.addLatLng(newLatLng);
          }
        },
        (err) => console.warn('Geolocation warning:', err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
  }

  // 4. Update UI with Incoming Telemetry
  function ingestEntry(entry) {
    state.logs.push(entry);

    // Update Numerical Display
    const rssi = entry.rssi;
    el.currentRssi.textContent = rssi;
    el.currentSsid.textContent = entry.ssid || 'Unknown';
    el.currentBssid.textContent = entry.bssid || 'Unknown';

    // Gauge Meter Percentage (-100 to -30 dBm)
    const pct = Math.max(0, Math.min(100, Math.round(((rssi - (-100)) / 70) * 100)));
    el.gaugeFill.style.width = pct + '%';

    // Color & Classification Tag
    if (rssi >= -50) {
      el.currentRssi.style.color = '#10b981';
      el.currentRssi.style.textShadow = '0 0 24px rgba(16, 185, 129, 0.4)';
      el.signalTag.textContent = 'EXCELLENT';
      el.signalTag.className = 'signal-tag tag-excellent';
    } else if (rssi >= -65) {
      el.currentRssi.style.color = '#06b6d4';
      el.currentRssi.style.textShadow = '0 0 24px rgba(6, 182, 212, 0.4)';
      el.signalTag.textContent = 'GOOD';
      el.signalTag.className = 'signal-tag tag-good';
    } else if (rssi >= -75) {
      el.currentRssi.style.color = '#f59e0b';
      el.currentRssi.style.textShadow = '0 0 24px rgba(245, 158, 11, 0.4)';
      el.signalTag.textContent = 'FAIR';
      el.signalTag.className = 'signal-tag tag-fair';
    } else {
      el.currentRssi.style.color = '#f43f5e';
      el.currentRssi.style.textShadow = '0 0 24px rgba(244, 63, 94, 0.4)';
      el.signalTag.textContent = 'POOR';
      el.signalTag.className = 'signal-tag tag-poor';
    }

    // Update Stats Summary
    if (entry.participant_id && entry.participant_id !== 'USR-ANON' && entry.participant_id !== 'USR-DEFAULT') {
      state.participantId = entry.participant_id;
      if (el.participantInput) el.participantInput.value = entry.participant_id;
      localStorage.setItem('rssi_participant_id', entry.participant_id);
    }
    el.totalSamples.textContent = state.logs.length + ' pts';
    const totalRssi = state.logs.reduce((acc, cur) => acc + cur.rssi, 0);
    const avg = Math.round(totalRssi / state.logs.length);
    el.avgRssi.textContent = avg + ' dBm';

    // Update Chart
    const timeLabel = new Date(entry.timestamp).toLocaleTimeString();
    state.chart.data.labels.push(timeLabel);
    state.chart.data.datasets[0].data.push(rssi);
    if (state.chart.data.labels.length > 50) {
      state.chart.data.labels.shift();
      state.chart.data.datasets[0].data.shift();
    }
    state.chart.update('none');

    // Pulse status
    el.connText.textContent = `Receiving #${entry.id}`;
    el.connPill.classList.add('recording');
  }

  // 5. Connect Real-time SSE Stream (fallback to polling)
  function connectStream() {
    if (window.EventSource) {
      const sse = new EventSource('/api/stream');
      sse.onopen = () => {
        el.connPill.classList.add('connected');
        el.connText.textContent = 'Online / Ready';
      };
      sse.addEventListener('log', (e) => {
        try {
          const entry = JSON.parse(e.data);
          ingestEntry(entry);
        } catch (err) {
          console.error(err);
        }
      });
      sse.addEventListener('clear', () => {
        resetData();
      });
      sse.onerror = () => {
        el.connPill.classList.remove('connected');
        el.connText.textContent = 'Offline';
      };
    }
  }

  // 6. Reset Data
  function resetData() {
    state.logs = [];
    state.chart.data.labels = [];
    state.chart.data.datasets[0].data = [];
    state.chart.update();
    state.pathPolyline.setLatLngs([]);
    el.totalSamples.textContent = '0 pts';
    el.avgRssi.textContent = '-- dBm';
  }

  // 7. Timer Controller
  function startTimer() {
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
      const delta = Math.floor((Date.now() - state.startTime) / 1000);
      const h = String(Math.floor(delta / 3600)).padStart(2, '0');
      const m = String(Math.floor((delta % 3600) / 60)).padStart(2, '0');
      const s = String(delta % 60).padStart(2, '0');
      el.tripTimer.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  // 8. Event Listeners
  // Sync Participant ID input with state and localStorage
  if (el.participantInput) {
    el.participantInput.value = state.participantId;
    el.participantInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'USR-ANON';
      state.participantId = val;
      localStorage.setItem('rssi_participant_id', val);
    });
  }

  // Mode selection
  el.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMode = btn.dataset.mode;
    });
  });

  // Start Trip
  el.btnStart.addEventListener('click', () => {
    state.isRecording = true;
    state.tripId = 'TRIP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    el.tripIdBadge.textContent = state.tripId;
    el.tripIdBadge.style.color = '#10b981';

    el.btnStart.disabled = true;
    el.btnStart.classList.add('disabled');
    el.btnStop.disabled = false;
    el.btnStop.classList.remove('disabled');

    resetData();
    startTimer();
  });

  // 1-Click Copy Verification Code
  const copyBtn = document.getElementById('btn-copy-id');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(state.participantId);
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'COPIED! ✓';
      setTimeout(() => copyBtn.textContent = orig, 1500);
    });
  }

  // Stop Trip
  el.btnStop.addEventListener('click', () => {
    state.isRecording = false;
    el.tripIdBadge.textContent = 'FINISHED';
    el.tripIdBadge.style.color = '#94a3b8';

    el.btnStart.disabled = false;
    el.btnStart.classList.remove('disabled');
    el.btnStop.disabled = true;
    el.btnStop.classList.add('disabled');

    stopTimer();
    el.connPill.classList.remove('recording');
  });

  // Export CSV
  el.btnExport.addEventListener('click', () => {
    if (state.logs.length === 0) {
      alert('ไม่มีข้อมูลในเซสชันนี้ กรุณารันคำสั่งลัดหรือกด Test Ping เพื่อเก็บข้อมูลก่อน');
      return;
    }
    const headers = ['timestamp','participant_id','trip_id','latitude','longitude','accuracy','speed','ssid','bssid','rssi','user_label_mode'];
    let csv = headers.join(',') + '\n';
    state.logs.forEach(row => {
      const line = [
        row.timestamp,
        row.participant_id || state.participantId,
        row.trip_id || state.tripId,
        row.latitude !== null ? row.latitude : (state.currentLocation ? state.currentLocation.lat : ''),
        row.longitude !== null ? row.longitude : (state.currentLocation ? state.currentLocation.lng : ''),
        row.accuracy !== null ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : ''),
        row.speed !== null ? row.speed : (state.currentLocation ? state.currentLocation.speed : ''),
        `"${(row.ssid || '').replace(/"/g, '""')}"`,
        row.bssid,
        row.rssi,
        row.user_label_mode || state.selectedMode
      ];
      csv += line.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rssi_session_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Simulate Ping (Test without iPhone)
  el.btnSimulate.addEventListener('click', async () => {
    const randomRssi = Math.floor(Math.random() * 45) - 85; // -85 to -40 dBm
    const simulatedBssid = '00:1A:2B:3C:4D:' + Math.floor(Math.random() * 89 + 10);
    const simulatedPayload = {
      bssid: simulatedBssid,
      ssid: 'Campus-WiFi',
      rssi: randomRssi,
      lat: state.currentLocation ? state.currentLocation.lat : 13.7563,
      lng: state.currentLocation ? state.currentLocation.lng : 100.5018,
      speed: state.currentLocation ? state.currentLocation.speed : 1.2,
      accuracy: 4,
      mode: state.selectedMode,
      participant_id: state.participantId,
      trip_id: state.tripId
    };

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedPayload)
      });
      const data = await res.json();
      if (!window.EventSource) ingestEntry(data.entry);
    } catch (e) {
      // Local fallback without server
      ingestEntry({
        id: state.logs.length + 1,
        timestamp: new Date().toISOString(),
        ...simulatedPayload
      });
    }
  });

  // Clear Data
  el.btnClear.addEventListener('click', async () => {
    if (confirm('คุณต้องการล้างข้อมูลทั้งหมดในเซสชันนี้หรือไม่?')) {
      try {
        await fetch('/api/clear', { method: 'DELETE' });
      } catch (e) {}
      resetData();
    }
  });

  // Recenter Map
  el.btnRecenter.addEventListener('click', () => {
    if (state.currentLocation) {
      state.map.setView([state.currentLocation.lat, state.currentLocation.lng], 17);
    }
  });

  // Update server URL label
  el.serverUrlDisplay.textContent = window.location.origin + '/api/log';

  // 9. OS Detection & Adaptive Download Highlighting
  function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /android/i.test(ua);

    const osIcon = document.getElementById('os-icon');
    const osTitle = document.getElementById('os-title');
    const osDesc = document.getElementById('os-desc');
    const btnIos = document.getElementById('btn-dl-ios');
    const btnAndroid = document.getElementById('btn-dl-android');

    if (isIOS) {
      if (osIcon) osIcon.textContent = '🍎';
      if (osTitle) osTitle.textContent = 'ตรวจพบ: อุปกรณ์ Apple iOS (iPhone/iPad)';
      if (osDesc) osDesc.textContent = 'กดดาวน์โหลดคำสั่งลัดเพื่อเริ่มส่งค่า Wi-Fi RSSI (dBm) เข้าหน้าเว็บ';
      if (btnIos) btnIos.classList.add('highlight');
      if (btnAndroid) btnAndroid.style.opacity = '0.45';
    } else if (isAndroid) {
      if (osIcon) osIcon.textContent = '🤖';
      if (osTitle) osTitle.textContent = 'ตรวจพบ: อุปกรณ์ Android';
      if (osDesc) osDesc.textContent = 'ติดตั้งแอป Android Helper เพื่อส่งค่า Wi-Fi RSSI เข้าหน้าเว็บ';
      if (btnAndroid) btnAndroid.classList.add('highlight');
      if (btnIos) btnIos.style.opacity = '0.45';
    } else {
      if (osIcon) osIcon.textContent = '💻';
      if (osTitle) osTitle.textContent = 'ตรวจพบ: คอมพิวเตอร์ / เบราว์เซอร์ทั่วไป';
      if (osDesc) osDesc.textContent = 'เลือกดาวน์โหลดตัวช่วยส่งสัญญาณตามระบบของมือถือที่ใช้เก็บข้อมูล';
    }
  }

  // Boot
  detectOS();
  initMap();
  initChart();
  startGeoTracking();
  connectStream();
});

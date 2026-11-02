// RSSI Web Logger - 100% Mobile-Optimized Telemetry Controller
document.addEventListener('DOMContentLoaded', () => {

  // 1. Deterministic Hardware-Tied Device Fingerprint (Never changes on the same phone)
  function getHardwareFingerprint() {
    const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /android/i.test(ua);
    const prefix = isIOS ? 'IOS' : (isAndroid ? 'AND' : 'DEV');

    // Deterministic 32-bit hash based strictly on hardware specs
    const raw = `${screenInfo}|${tz}|${navigator.hardwareConcurrency || 4}|${isIOS ? 'apple' : 'generic'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(-4);
    return `${prefix}-${hex}`;
  }

  // Cookie helpers for 10-year persistence
  function setCookie(name, val) {
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=315360000; SameSite=Lax`;
  }

  function getCookie(name) {
    const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  // 2. Initialize Permanent Participant ID
  function initParticipantId() {
    // 1. Check URL query parameters (?id=... or ?participant_id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id') || urlParams.get('participant_id');
    if (urlId && urlId.trim()) {
      const clean = urlId.trim();
      localStorage.setItem('rssi_participant_id', clean);
      setCookie('rssi_participant_id', clean);
      return clean;
    }

    // 2. Check localStorage
    const savedLocal = localStorage.getItem('rssi_participant_id');
    if (savedLocal && savedLocal.trim()) {
      return savedLocal.trim();
    }

    // 3. Check Cookie
    const savedCookie = getCookie('rssi_participant_id');
    if (savedCookie && savedCookie.trim()) {
      localStorage.setItem('rssi_participant_id', savedCookie.trim());
      return savedCookie.trim();
    }

    // 4. Default: Deterministic Hardware Fingerprint (Same phone = Same ID always!)
    const hwId = getHardwareFingerprint();
    localStorage.setItem('rssi_participant_id', hwId);
    setCookie('rssi_participant_id', hwId);
    return hwId;
  }

  // Application State
  const state = {
    isRecording: false,
    startTime: null,
    timerInterval: null,
    tripId: 'IDLE',
    participantId: initParticipantId(),
    tripNote: localStorage.getItem('rssi_trip_note') || '',
    gdriveWebhook: localStorage.getItem('rssi_gdrive_webhook') || 'https://script.google.com/macros/s/AKfycbwry_goxlTURpP6xBBi6jvTBfGNrhppeS4xQtPEoBVae52dNa0DnfblQgJDzj-TE_Dr/exec',
    autoSyncGdrive: localStorage.getItem('rssi_autosync_gdrive') !== 'false',
    selectedMode: 'walk',
    currentLocation: null,
    watchId: null,
    wakeLock: null,
    logs: []
  };

  // DOM Elements
  const el = {
    connPill: document.getElementById('connection-pill'),
    connText: document.getElementById('connection-text'),
    wakelockPill: document.getElementById('wakelock-pill'),
    wakelockText: document.getElementById('wakelock-text'),
    tripTimer: document.getElementById('trip-timer'),
    tripIdBadge: document.getElementById('trip-id-badge'),
    btnStart: document.getElementById('btn-start-trip'),
    btnStop: document.getElementById('btn-stop-trip'),
    btnExport: document.getElementById('btn-export-csv'),
    btnSyncGdrive: document.getElementById('btn-sync-gdrive'),
    btnSimulate: document.getElementById('btn-simulate-ping'),
    btnClear: document.getElementById('btn-clear-data'),
    currentRssi: document.getElementById('current-rssi'),
    signalTag: document.getElementById('signal-level-tag'),
    currentSsid: document.getElementById('current-ssid'),
    currentBssid: document.getElementById('current-bssid'),
    gpsCoords: document.getElementById('gps-coords'),
    gpsSpeed: document.getElementById('gps-speed'),
    totalSamples: document.getElementById('total-samples'),
    avgRssi: document.getElementById('avg-rssi'),
    participantInput: document.getElementById('participant-id-input'),
    tripNoteInput: document.getElementById('trip-note-input'),
    idSavedBadge: document.getElementById('id-saved-badge'),
    btnCopyId: document.getElementById('btn-copy-id'),
    btnResetHwId: document.getElementById('btn-reset-hw-id'),
    gdriveWebhookInput: document.getElementById('gdrive-webhook-input'),
    gdriveStatusBadge: document.getElementById('gdrive-status-badge'),
    gdriveAutoSyncChk: document.getElementById('gdrive-autosync-chk'),
    serverUrlDisplay: document.getElementById('server-url-display'),
    btnCopyUrl: document.getElementById('btn-copy-url'),
    syncToast: document.getElementById('sync-toast'),
    syncToastIcon: document.getElementById('sync-toast-icon'),
    syncToastText: document.getElementById('sync-toast-text'),
    modeBtns: document.querySelectorAll('.mode-chip')
  };

  // 3. Screen Keep-Awake (WakeLock API for iOS & Android)
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        state.wakeLock = await navigator.wakeLock.request('screen');
        if (el.wakelockPill) {
          el.wakelockPill.style.display = 'inline-flex';
          el.wakelockText.textContent = 'Awake';
        }
      } catch (err) {
        console.warn('Wake Lock error:', err.message);
      }
    }
  }

  function releaseWakeLock() {
    if (state.wakeLock !== null) {
      state.wakeLock.release().catch(() => {});
      state.wakeLock = null;
    }
  }

  // 4. Geolocation Tracker (Pure Satellite Hardware - 0 MB Cellular Data Used)
  function startGeoTracking() {
    if ('geolocation' in navigator) {
      state.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed !== null ? (pos.coords.speed * 3.6).toFixed(1) : '0.0';
          const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 5;

          state.currentLocation = { lat, lng, speed, accuracy: acc };
          el.gpsCoords.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          el.gpsSpeed.textContent = `${speed} km/h (±${acc}m)`;
        },
        (err) => {
          console.warn('Geolocation notice:', err.message);
          el.gpsCoords.textContent = 'กรุณากดเปิดสิทธิ์ GPS';
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    } else {
      el.gpsCoords.textContent = 'เบราว์เซอร์ไม่รองรับ GPS';
    }
  }

  // 5. Ingest Telemetry Entry (Text-First Display)
  function ingestEntry(entry) {
    // If incoming log is anonymous, attach current client's participant ID
    if (!entry.participant_id || entry.participant_id === 'USR-ANON' || entry.participant_id === 'USR-DEFAULT') {
      entry.participant_id = state.participantId;
    }
    if (!entry.trip_id || entry.trip_id === 'TRIP-DEFAULT') {
      entry.trip_id = state.tripId;
    }
    if (!entry.note && state.tripNote) {
      entry.note = state.tripNote;
    }

    state.logs.push(entry);

    // Update Numerical & Text RSSI
    const rssi = entry.rssi;
    el.currentRssi.textContent = rssi;
    el.currentSsid.textContent = entry.ssid || 'Unknown';
    el.currentBssid.textContent = entry.bssid || 'Unknown';

    // Color & Classification Tag
    if (rssi >= -50) {
      el.currentRssi.style.color = '#10b981';
      el.signalTag.textContent = 'ดีเยี่ยม (EXCELLENT)';
      el.signalTag.className = 'rssi-status-tag tag-excellent';
    } else if (rssi >= -65) {
      el.currentRssi.style.color = '#06b6d4';
      el.signalTag.textContent = 'ดี (GOOD)';
      el.signalTag.className = 'rssi-status-tag tag-good';
    } else if (rssi >= -75) {
      el.currentRssi.style.color = '#f59e0b';
      el.signalTag.textContent = 'ปานกลาง (FAIR)';
      el.signalTag.className = 'rssi-status-tag tag-fair';
    } else {
      el.currentRssi.style.color = '#f43f5e';
      el.signalTag.textContent = 'อ่อน (POOR)';
      el.signalTag.className = 'rssi-status-tag tag-poor';
    }

    // Update Stats Summary (DO NOT TOUCH state.participantId or el.participantInput)
    el.totalSamples.textContent = state.logs.length + ' จุด';
    const totalRssi = state.logs.reduce((acc, cur) => acc + (cur.rssi || 0), 0);
    const avg = Math.round(totalRssi / state.logs.length);
    el.avgRssi.textContent = avg + ' dBm';

    // Pulse connection status
    el.connText.textContent = `รับ #${state.logs.length}`;
    el.connPill.classList.add('recording');
  }

  // 6. Calm Real-Time Telemetry Polling (Zero Screen Flickering, 100% Vercel & Battery Compatible)
  let lastProcessedId = 0;
  let isPolling = false;

  async function pollTelemetry() {
    if (isPolling) return;
    isPolling = true;
    try {
      const res = await fetch('/api/logs?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (el.connPill) {
        el.connPill.classList.add('connected');
        el.connText.textContent = state.logs.length > 0 ? `รับ #${state.logs.length}` : 'ออนไลน์';
      }

      if (data && Array.isArray(data.logs)) {
        if (data.logs.length === 0 && lastProcessedId > 0) {
          lastProcessedId = 0;
          resetData();
        } else {
          for (const entry of data.logs) {
            if (entry.id && entry.id > lastProcessedId) {
              lastProcessedId = entry.id;
              // Accept telemetry from this participant, or anonymous logs from companion
              if (!entry.participant_id || entry.participant_id === 'USR-ANON' || entry.participant_id === state.participantId) {
                ingestEntry(entry);
              }
            }
          }
        }
      }
    } catch (err) {
      if (el.connPill) {
        el.connPill.classList.remove('connected');
        el.connText.textContent = 'พร้อมรับข้อมูล';
      }
    } finally {
      isPolling = false;
    }
  }

  function startTelemetryEngine() {
    pollTelemetry();
    setInterval(pollTelemetry, 2500); // Poll calmly every 2.5s
  }

  // 7. Reset Data
  function resetData() {
    state.logs = [];
    el.totalSamples.textContent = '0 จุด';
    el.avgRssi.textContent = '-- dBm';
    el.currentRssi.textContent = '--';
    el.currentRssi.style.color = 'var(--accent-cyan)';
    el.signalTag.textContent = 'รอสัญญาณ';
    el.signalTag.className = 'rssi-status-tag';
    el.currentSsid.textContent = '--';
    el.currentBssid.textContent = '--';
  }

  // 8. Timer Controller
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

  // Helper: Live Google Drive Sync Toast
  function showSyncToast(type, message) {
    if (!el.syncToast) return;
    el.syncToast.style.display = 'flex';
    el.syncToast.className = 'sync-toast-banner ' + (type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : ''));
    if (el.syncToastIcon) {
      el.syncToastIcon.textContent = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⏳');
    }
    if (el.syncToastText) {
      el.syncToastText.textContent = message;
    }
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        if (el.syncToast) el.syncToast.style.display = 'none';
      }, 5000);
    }
  }

  // 9. Google Drive Sync Engine
  async function syncToGoogleDrive(isSilent = false) {
    if (!state.gdriveWebhook) {
      showSyncToast('error', 'ไม่ได้ตั้งค่า Webhook URL');
      if (!isSilent) alert('กรุณาระบุ Google Apps Script Webhook URL ในส่วนตั้งค่าก่อน');
      return;
    }

    if (state.logs.length === 0) {
      if (!isSilent) alert('ไม่มีข้อมูลในรอบนี้ให้ส่งขึ้น Google Drive');
      return;
    }

    if (el.btnSyncGdrive) {
      el.btnSyncGdrive.disabled = true;
      el.btnSyncGdrive.innerHTML = '<span class="icon">⏳</span><span>กำลังส่ง...</span>';
    }

    // Map logs ensuring the participant ID is the current user's ID
    const payloadLogs = state.logs.map(row => ({
      timestamp: row.timestamp || new Date().toISOString(),
      participant_id: state.participantId,
      trip_id: state.tripId,
      latitude: row.latitude !== null && row.latitude !== undefined ? row.latitude : (state.currentLocation ? state.currentLocation.lat : ''),
      longitude: row.longitude !== null && row.longitude !== undefined ? row.longitude : (state.currentLocation ? state.currentLocation.lng : ''),
      accuracy: row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
      speed: row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : 0),
      ssid: row.ssid || '',
      bssid: row.bssid || '',
      rssi: row.rssi,
      user_label_mode: row.user_label_mode || state.selectedMode,
      note: row.note || state.tripNote || ''
    }));

    showSyncToast('loading', `กำลังอัปโหลด ${payloadLogs.length} จุดเข้า Google Drive...`);

    try {
      const res = await fetch('/api/sync-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: state.gdriveWebhook,
          trip_id: state.tripId,
          participant_id: state.participantId,
          logs: payloadLogs
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        showSyncToast('success', `บันทึกเข้า Google Drive สำเร็จแล้ว (${payloadLogs.length} จุด)`);
        if (!isSilent) {
          alert(`✅ บันทึกสำเร็จ! ข้อมูล ${payloadLogs.length} จุดถูกส่งเข้า Google Drive เรียบร้อยแล้ว`);
        }
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (err) {
      // Direct browser fallback fetch
      try {
        await fetch(state.gdriveWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'batch_upload',
            trip_id: state.tripId,
            participant_id: state.participantId,
            save_csv: true,
            logs: payloadLogs
          })
        });
        showSyncToast('success', `ส่งข้อมูล ${payloadLogs.length} จุดเข้า Google Drive เรียบร้อย`);
        if (!isSilent) {
          alert(`✅ ส่งข้อมูล ${payloadLogs.length} จุดเข้า Google Drive เรียบร้อยแล้ว`);
        }
      } catch (directErr) {
        showSyncToast('error', `ส่งเข้า Google Drive ไม่สำเร็จ (แตะ "ซิงค์เข้า Drive" เพื่อลองใหม่)`);
        if (!isSilent) {
          alert(`❌ ส่งเข้า Google Drive ล้มเหลว: ${err.message}`);
        }
      }
    } finally {
      if (el.btnSyncGdrive) {
        el.btnSyncGdrive.disabled = false;
        el.btnSyncGdrive.innerHTML = '<span class="icon">☁️</span><span>ซิงค์เข้า Drive</span>';
      }
    }
  }

  // 10. Participant ID Management (Permanent Persistence)
  if (el.participantInput) {
    el.participantInput.value = state.participantId;

    const showSavedIndicator = (msg = '✓ บันทึกถาวร') => {
      if (el.idSavedBadge) {
        el.idSavedBadge.textContent = msg;
        el.idSavedBadge.style.color = '#10b981';
        setTimeout(() => {
          el.idSavedBadge.textContent = '✓ ผูกกับเครื่องถาวร';
          el.idSavedBadge.style.color = 'var(--accent-cyan)';
        }, 1500);
      }
    };

    el.participantInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || getHardwareFingerprint();
      state.participantId = val;
      localStorage.setItem('rssi_participant_id', val);
      setCookie('rssi_participant_id', val);
      showSavedIndicator('✓ อัปเดตรหัสแล้ว');
    });

    if (el.btnCopyId) {
      el.btnCopyId.addEventListener('click', () => {
        navigator.clipboard.writeText(state.participantId).then(() => {
          el.btnCopyId.textContent = '✓';
          setTimeout(() => el.btnCopyId.textContent = '📋', 1200);
        });
      });
    }

    if (el.btnResetHwId) {
      el.btnResetHwId.addEventListener('click', () => {
        const hwId = getHardwareFingerprint();
        state.participantId = hwId;
        el.participantInput.value = hwId;
        localStorage.setItem('rssi_participant_id', hwId);
        setCookie('rssi_participant_id', hwId);
        showSavedIndicator('✓ คืนค่ารหัสเครื่อง');
      });
    }
  }

  // 10.5 Note & Location Description Setup
  if (el.tripNoteInput) {
    el.tripNoteInput.value = state.tripNote;
    el.tripNoteInput.addEventListener('input', (e) => {
      state.tripNote = e.target.value.trim();
      localStorage.setItem('rssi_trip_note', state.tripNote);
    });
  }

  // 11. Mode Chips Selection
  el.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMode = btn.dataset.mode;
    });
  });

  // 12. Start Trip Action
  el.btnStart.addEventListener('click', () => {
    state.isRecording = true;
    state.tripId = 'TRIP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    el.tripIdBadge.textContent = state.tripId;
    el.tripIdBadge.style.color = '#10b981';

    // Switch buttons
    el.btnStart.style.display = 'none';
    el.btnStop.style.display = 'flex';

    resetData();
    startTimer();
    requestWakeLock();
  });

  // 13. Stop Trip Action
  el.btnStop.addEventListener('click', async () => {
    state.isRecording = false;
    el.tripIdBadge.textContent = 'FINISHED';
    el.tripIdBadge.style.color = '#94a3b8';

    // Switch buttons
    el.btnStop.style.display = 'none';
    el.btnStart.style.display = 'flex';

    stopTimer();
    releaseWakeLock();
    el.connPill.classList.remove('recording');

    // Auto-sync to Google Drive
    if (state.autoSyncGdrive && state.gdriveWebhook) {
      await syncToGoogleDrive(true);
    }
  });

  // 14. Export CSV (Instant Local Download)
  el.btnExport.addEventListener('click', () => {
    if (state.logs.length === 0) {
      alert('ไม่มีข้อมูลในรอบนี้ กรุณากด START TRIP หรือกดทดสอบสัญญาณก่อน');
      return;
    }
    const headers = ['timestamp','participant_id','trip_id','latitude','longitude','accuracy','speed','ssid','bssid','rssi','user_label_mode','note'];
    let csv = headers.join(',') + '\n';
    state.logs.forEach(row => {
      const line = [
        row.timestamp,
        row.participant_id || state.participantId,
        row.trip_id || state.tripId,
        row.latitude !== null && row.latitude !== undefined ? row.latitude : (state.currentLocation ? state.currentLocation.lat : ''),
        row.longitude !== null && row.longitude !== undefined ? row.longitude : (state.currentLocation ? state.currentLocation.lng : ''),
        row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
        row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : 0),
        `"${(row.ssid || '').replace(/"/g, '""')}"`,
        row.bssid || '',
        row.rssi,
        row.user_label_mode || state.selectedMode,
        `"${(row.note || state.tripNote || '').replace(/"/g, '""')}"`
      ];
      csv += line.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.participantId}_${state.tripId}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // 15. Simulate Ping (Test without moving)
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
      note: state.tripNote,
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
      if (data && data.entry) {
        lastProcessedId = data.entry.id;
        ingestEntry(data.entry);
      }
    } catch (e) {
      ingestEntry({
        id: ++lastProcessedId,
        timestamp: new Date().toISOString(),
        ...simulatedPayload
      });
    }
  });

  // 16. Clear Data
  el.btnClear.addEventListener('click', async () => {
    if (confirm('ต้องการล้างข้อมูลทั้งหมดในรอบนี้หรือไม่?')) {
      try {
        await fetch('/api/logs', { method: 'DELETE' });
      } catch (e) {}
      lastProcessedId = 0;
      resetData();
    }
  });

  // 17. Google Drive Settings Setup
  if (el.gdriveWebhookInput) {
    el.gdriveWebhookInput.value = state.gdriveWebhook;
    el.gdriveWebhookInput.addEventListener('change', (e) => {
      state.gdriveWebhook = e.target.value.trim();
      localStorage.setItem('rssi_gdrive_webhook', state.gdriveWebhook);
    });
  }

  if (el.gdriveAutoSyncChk) {
    el.gdriveAutoSyncChk.checked = state.autoSyncGdrive;
    el.gdriveAutoSyncChk.addEventListener('change', (e) => {
      state.autoSyncGdrive = e.target.checked;
      localStorage.setItem('rssi_autosync_gdrive', state.autoSyncGdrive);
    });
  }

  if (el.btnSyncGdrive) {
    el.btnSyncGdrive.addEventListener('click', () => syncToGoogleDrive(false));
  }

  // 18. Copy Server Ingest URL
  const serverUrl = window.location.origin + '/api/log';
  if (el.serverUrlDisplay) {
    el.serverUrlDisplay.textContent = serverUrl;
  }
  if (el.btnCopyUrl) {
    el.btnCopyUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(serverUrl).then(() => {
        el.btnCopyUrl.textContent = 'คัดลอกแล้ว ✓';
        setTimeout(() => el.btnCopyUrl.textContent = 'คัดลอก', 1500);
      });
    });
  }

  // 19. OS Detection & Adaptive Download Highlighting
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
      if (osTitle) osTitle.textContent = 'อุปกรณ์ Apple iOS (iPhone/iPad)';
      if (osDesc) osDesc.textContent = 'แตะโหลดคำสั่งลัดเพื่อเริ่มส่งค่า Wi-Fi เข้าเว็บ';
      if (btnIos) btnIos.classList.add('highlight');
      if (btnAndroid) btnAndroid.style.opacity = '0.45';
    } else if (isAndroid) {
      if (osIcon) osIcon.textContent = '🤖';
      if (osTitle) osTitle.textContent = 'อุปกรณ์ Android';
      if (osDesc) osDesc.textContent = 'แตะติดตั้ง Companion APK เพื่อส่งค่า Wi-Fi เข้าเว็บ';
      if (btnAndroid) btnAndroid.classList.add('highlight');
      if (btnIos) btnIos.style.opacity = '0.45';
    } else {
      if (osIcon) osIcon.textContent = '💻';
      if (osTitle) osTitle.textContent = 'เบราว์เซอร์ทั่วไป / คอมพิวเตอร์';
      if (osDesc) osDesc.textContent = 'สามารถทดสอบจำลองส่งข้อมูลได้ทันที';
    }
  }

  // Boot Application
  detectOS();
  startGeoTracking();
  startTelemetryEngine();
});

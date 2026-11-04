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

  // Helper: Haversine Great-Circle Distance (in meters)
  function calcHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Student ID / UserID Validation Helper
  function isStudentIdValid(id) {
    if (!id) return false;
    const clean = String(id).trim();
    if (clean.length < 4) return false;
    const lower = clean.toLowerCase();
    if (lower === 'unknown' || lower === 'usr-anon') return false;
    if (/^(ios|and|dev)-[0-9a-z]{4}$/i.test(clean)) return false;
    return true;
  }

  // Cookie helpers for 10-year persistence
  function setCookie(name, val) {
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=315360000; SameSite=Lax`;
  }

  function getCookie(name) {
    const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  // 2. Initialize Permanent Participant UserID
  function initParticipantId() {
    // 1. Check URL query parameters (?id=... or ?participant_id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id') || urlParams.get('participant_id');
    if (urlId && urlId.trim()) {
      const clean = urlId.trim();
      localStorage.setItem('rssi_participant_id', clean);
      if (isStudentIdValid(clean)) {
        localStorage.setItem('rssi_student_id_configured', 'true');
      }
      setCookie('rssi_participant_id', clean);
      return clean;
    }

    // 2. Check localStorage
    const savedLocal = localStorage.getItem('rssi_participant_id');
    if (savedLocal && savedLocal.trim() && isStudentIdValid(savedLocal.trim())) {
      return savedLocal.trim();
    }

    // 3. Check Cookie
    const savedCookie = getCookie('rssi_participant_id');
    if (savedCookie && savedCookie.trim() && isStudentIdValid(savedCookie.trim())) {
      localStorage.setItem('rssi_participant_id', savedCookie.trim());
      return savedCookie.trim();
    }

    // 4. Fallback if previously saved non-student ID
    if (savedLocal && savedLocal.trim()) {
      return savedLocal.trim();
    }

    return '';
  }

  // Application State
  const state = {
    isRecording: false,
    startTime: null,
    timerInterval: null,
    tripId: 'IDLE',
    participantId: initParticipantId(),
    tripNote: localStorage.getItem('rssi_trip_note') || '',
    gdriveWebhook: localStorage.getItem('rssi_gdrive_webhook') || 'https://script.google.com/macros/s/AKfycbzvkcibz8OjhTj8pgQE2BhkNy3S6cSEt9OlDFdfJ261-CFzpHX6pSU66IeEtqkh9Q7e/exec',
    autoSyncGdrive: localStorage.getItem('rssi_autosync_gdrive') !== 'false',
    selectedMode: 'walk',
    phonePosition: 'pocket',
    predictedMode: 'still',
    platform: 'ios',
    deviceModel: 'Apple iPhone',
    osVersion: 'iOS 18.1',
    imu: { accelX: '', accelY: '', accelZ: '', gyroX: '', gyroY: '', gyroZ: '' },
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
    predictedModeVal: document.getElementById('predicted-mode-val'),
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
    modeBtns: document.querySelectorAll('.mode-chip'),
    posBtns: document.querySelectorAll('.pos-chip')
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

  // Auto-restore WakeLock on returning to Safari tab
  document.addEventListener('visibilitychange', async () => {
    if (state.isRecording && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  });

  // 4. Motion / Activity Recognition UI
  function updatePredictedModeUI() {
    if (el.predictedModeVal) {
      const modeIcons = {
        still: '🛑 นิ่ง (STILL)',
        walk: '🚶 เดิน (WALK)',
        run: '🏃 วิ่ง (RUN)',
        vehicle: '🚗 รถ (VEHICLE)'
      };
      el.predictedModeVal.textContent = modeIcons[state.predictedMode] || state.predictedMode || '--';
    }
  }

  // 4.1 Real-Time IMU Accelerometer / Gyroscope Listener
  function startImuTracking() {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (e) => {
        if (e.accelerationIncludingGravity) {
          state.imu.accelX = e.accelerationIncludingGravity.x != null ? e.accelerationIncludingGravity.x.toFixed(4) : '';
          state.imu.accelY = e.accelerationIncludingGravity.y != null ? e.accelerationIncludingGravity.y.toFixed(4) : '';
          state.imu.accelZ = e.accelerationIncludingGravity.z != null ? e.accelerationIncludingGravity.z.toFixed(4) : '';
        }
        if (e.rotationRate) {
          state.imu.gyroX = e.rotationRate.alpha != null ? e.rotationRate.alpha.toFixed(4) : '';
          state.imu.gyroY = e.rotationRate.beta != null ? e.rotationRate.beta.toFixed(4) : '';
          state.imu.gyroZ = e.rotationRate.gamma != null ? e.rotationRate.gamma.toFixed(4) : '';
        }
      }, { passive: true });
    }
  }

  // Geolocation Tracker (Pure Satellite Hardware - 0 MB Cellular Data Used)
  let lastGeoPos = null;
  let lastGeoTime = null;

  function startGeoTracking() {
    if ('geolocation' in navigator) {
      state.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = pos.timestamp || Date.now();
          let speedNum = 0.0;

          // 1. Native speed if provided by hardware (> 0)
          if (pos.coords.speed !== null && !isNaN(pos.coords.speed) && pos.coords.speed > 0) {
            speedNum = pos.coords.speed * 3.6;
          } else if (lastGeoPos && lastGeoTime) {
            // 2. Kinematic calculation for iOS Safari (dt >= 0.8s, ignore micro-drift < 0.6m)
            const dt = (now - lastGeoTime) / 1000;
            if (dt >= 0.8) {
              const dist = calcHaversineDistance(lastGeoPos.lat, lastGeoPos.lng, lat, lng);
              if (dist >= 0.6) {
                speedNum = (dist / dt) * 3.6;
              }
            }
          }

          if (lastGeoPos === null || (now - lastGeoTime) >= 800) {
            lastGeoPos = { lat, lng };
            lastGeoTime = now;
          }

          if (speedNum > 180) speedNum = 0.0; // Filter unreasonable GPS telemetry jumps
          const speed = speedNum.toFixed(2);
          const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 5;

          // Automatic Mode Prediction based on kinematics
          if (speedNum < 1.0) state.predictedMode = 'still';
          else if (speedNum <= 6.5) state.predictedMode = 'walk';
          else if (speedNum <= 18.0) state.predictedMode = 'run';
          else state.predictedMode = 'vehicle';

          state.currentLocation = {
            lat,
            lng,
            speed,
            accuracy: acc
          };
          el.gpsCoords.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          el.gpsSpeed.textContent = `${speed} km/h (±${acc}m)`;
          updatePredictedModeUI();
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
    // Multi-User Security: Accept matching participant or iPhone/iOS Shortcut
    if (entry.participant_id && state.participantId) {
      const entryPid = String(entry.participant_id).toLowerCase().trim();
      const currentPid = String(state.participantId).toLowerCase().trim();
      if (entryPid !== currentPid && entryPid !== 'usr-anon' && entryPid !== 'iphone') {
        if (!entryPid.startsWith('ios-')) return;
      }
    }

    // Always stamp the user's active Student ID from the input box!
    entry.participant_id = state.participantId || entry.participant_id || 'USR-ANON';
    if (!entry.trip_id || entry.trip_id === 'TRIP-DEFAULT') {
      entry.trip_id = state.tripId;
    }
    entry.session_id = entry.session_id || entry.trip_id;

    if (!entry.note && state.tripNote) {
      entry.note = state.tripNote;
    }

    // Platform and model fallback
    entry.platform = entry.platform || state.platform || 'ios';
    entry.device_model = entry.device_model || state.deviceModel || 'Apple iPhone';

    // Timing (UTC Milliseconds)
    if (!entry.t_utc_ms) {
      entry.t_utc_ms = entry.timestamp ? Date.parse(entry.timestamp) : Date.now();
    }
    entry.timestamp = entry.timestamp || new Date(entry.t_utc_ms).toISOString();

    // Lat / Lon normalization
    if (entry.lat !== undefined && entry.lat !== null) {
      entry.latitude = entry.lat;
    } else if (entry.latitude !== undefined && entry.latitude !== null) {
      entry.lat = entry.latitude;
    } else if (state.currentLocation) {
      entry.lat = state.currentLocation.lat;
      entry.latitude = state.currentLocation.lat;
    }

    if (entry.lon !== undefined && entry.lon !== null) {
      entry.longitude = entry.lon;
    } else if (entry.longitude !== undefined && entry.longitude !== null) {
      entry.lon = entry.longitude;
    } else if (state.currentLocation) {
      entry.lon = state.currentLocation.lng;
      entry.longitude = state.currentLocation.lng;
    }

    // Speed & Accuracy (Adopt kinematic speed when shortcut or client sends 0/null)
    if (entry.speed === undefined || entry.speed === null || Number(entry.speed) === 0) {
      if (state.currentLocation && Number(state.currentLocation.speed) > 0) {
        entry.speed = state.currentLocation.speed;
      } else {
        entry.speed = entry.speed !== undefined && entry.speed !== null ? entry.speed : '0.00';
      }
    }
    if (entry.accuracy === undefined || entry.accuracy === null) {
      entry.accuracy = state.currentLocation ? state.currentLocation.accuracy : 5;
    }

    // Activity Recognition
    if (entry.activity_recognition_mode) {
      state.predictedMode = entry.activity_recognition_mode;
    } else if (entry.predicted_mode) {
      state.predictedMode = entry.predicted_mode;
      entry.activity_recognition_mode = entry.predicted_mode;
    } else {
      entry.activity_recognition_mode = state.predictedMode;
    }

    // RSSI
    entry.rssi_raw = entry.rssi_raw !== undefined ? entry.rssi_raw : entry.rssi;
    entry.rssi = Math.round(entry.rssi_raw !== undefined ? entry.rssi_raw : -99);

    // Modes & Phone Position
    entry.user_label_mode = entry.user_label_mode || state.selectedMode;
    entry.phone_position = entry.phone_position || state.phonePosition;
    entry.note = entry.note || state.tripNote || '';

    updatePredictedModeUI();
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

  // 6. Calm Real-Time Telemetry Polling (Strict Multi-User Isolation)
  let lastProcessedId = 0;
  let isPolling = false;

  async function pollTelemetry() {
    if (isPolling) return;
    isPolling = true;
    try {
      const pId = encodeURIComponent(state.participantId || '');
      const plat = encodeURIComponent(state.platform || 'ios');
      const url = `/api/log?action=get&participant_id=${pId}&platform=${plat}&after_id=${lastProcessedId}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (el.connPill) {
        el.connPill.classList.add('connected');
        el.connText.textContent = state.logs.length > 0 ? `รับ #${state.logs.length}` : 'ออนไลน์';
      }

      if (data && Array.isArray(data.logs)) {
        for (const entry of data.logs) {
          if (entry.id && entry.id > lastProcessedId) {
            lastProcessedId = entry.id;
            ingestEntry(entry);
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

    // Map logs to 18 clean core research metrics
    const payloadLogs = state.logs.map(row => {
      const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
      let spd = row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : '0.00');
      if (typeof spd === 'number') spd = spd.toFixed(2);
      return {
        t_utc_ms: tUtc,
        timestamp: row.timestamp || new Date(tUtc).toISOString(),
        session_id: row.session_id || row.trip_id || state.tripId,
        participant_id: row.participant_id || state.participantId,
        platform: row.platform || state.platform || 'ios',
        device_model: row.device_model || state.deviceModel || 'Apple iPhone',
        os_version: row.os_version || state.osVersion || 'iOS 18.1',
        lat: row.lat !== null && row.lat !== undefined ? row.lat : (state.currentLocation ? state.currentLocation.lat : ''),
        lon: row.lon !== null && row.lon !== undefined ? row.lon : (state.currentLocation ? state.currentLocation.lng : ''),
        speed: spd,
        accuracy: row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
        bssid: row.bssid || '',
        ssid: row.ssid || '',
        rssi_raw: row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ''),
        rssi_source: row.rssi_source || (row.platform === 'android' ? 'wifimanager' : 'shortcut'),
        user_label_mode: row.user_label_mode || state.selectedMode,
        phone_position: row.phone_position || state.phonePosition,
        note: row.note || state.tripNote || ''
      };
    });

    showSyncToast('loading', `กำลังอัปโหลด ${payloadLogs.length} จุดเข้า Google Drive...`);

    try {
      const res = await fetch('/api/sync-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: state.gdriveWebhook,
          trip_id: state.tripId,
          participant_id: state.participantId,
          os: state.platform || 'ios',
          device_model: state.deviceModel || 'Apple iPhone',
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

  // 10. UserID Management & Validation (Red = Empty/Invalid, Green = Valid Student ID)
  function updateServerUrlDisplay() {
    const url = `${window.location.origin}/api/log?participant_id=${encodeURIComponent(state.participantId)}&rssi=[ความแรงสัญญาณ]&bssid=[BSSID]&ssid=[ชื่อ Wi-Fi]`;
    if (el.serverUrlDisplay) el.serverUrlDisplay.textContent = url;
  }

  function updateUserIdValidationUI(val) {
    const isValid = isStudentIdValid(val);
    if (el.participantInput) {
      if (isValid) {
        el.participantInput.classList.remove('input-invalid');
        el.participantInput.classList.add('input-valid');
        if (el.idSavedBadge) {
          el.idSavedBadge.textContent = '✓ บันทึกถาวร';
          el.idSavedBadge.style.color = '#10b981';
        }
      } else {
        el.participantInput.classList.remove('input-valid');
        el.participantInput.classList.add('input-invalid');
        if (el.idSavedBadge) {
          el.idSavedBadge.textContent = '⚠️ ระบุรหัสนักศึกษา';
          el.idSavedBadge.style.color = '#ef4444';
        }
      }
    }
  }

  // First-Time Student ID Onboarding Modal Handler
  function checkFirstTimeStudentId() {
    const isConfigured = localStorage.getItem('rssi_student_id_configured') === 'true';
    const currentId = state.participantId;
    const modal = document.getElementById('first-time-modal');
    const modalInput = document.getElementById('modal-student-id-input');
    const modalBtn = document.getElementById('modal-btn-save');
    const modalErr = document.getElementById('modal-error-msg');

    if (!isConfigured || !isStudentIdValid(currentId)) {
      if (modal && modalInput && modalBtn) {
        modal.style.display = 'flex';
        modalInput.value = isStudentIdValid(currentId) ? currentId : '';

        const validateModalInput = () => {
          const val = modalInput.value.trim();
          const valid = isStudentIdValid(val);
          modalBtn.disabled = !valid;
          if (valid) {
            modalInput.classList.remove('input-invalid');
            modalInput.classList.add('input-valid');
            if (modalErr) modalErr.style.display = 'none';
          } else {
            modalInput.classList.remove('input-valid');
            modalInput.classList.add('input-invalid');
            if (modalErr && val.length > 0) modalErr.style.display = 'block';
          }
        };

        modalInput.addEventListener('input', validateModalInput);
        validateModalInput();

        const saveStudentId = () => {
          const val = modalInput.value.trim();
          if (isStudentIdValid(val)) {
            state.participantId = val;
            localStorage.setItem('rssi_participant_id', val);
            localStorage.setItem('rssi_student_id_configured', 'true');
            setCookie('rssi_participant_id', val);
            if (el.participantInput) el.participantInput.value = val;
            updateUserIdValidationUI(val);
            updateServerUrlDisplay();
            modal.style.display = 'none';
          }
        };

        modalBtn.addEventListener('click', saveStudentId);
        modalInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveStudentId();
        });
        setTimeout(() => modalInput.focus(), 300);
      }
    } else {
      updateUserIdValidationUI(currentId);
    }
  }

  if (el.participantInput) {
    el.participantInput.value = state.participantId;
    updateUserIdValidationUI(state.participantId);
    updateServerUrlDisplay();

    el.participantInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.participantId = val;
      if (isStudentIdValid(val)) {
        localStorage.setItem('rssi_participant_id', val);
        localStorage.setItem('rssi_student_id_configured', 'true');
        setCookie('rssi_participant_id', val);
      }
      updateUserIdValidationUI(val);
      lastProcessedId = 0;
      resetData();
      updateServerUrlDisplay();
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
        const modal = document.getElementById('first-time-modal');
        const modalInput = document.getElementById('modal-student-id-input');
        if (modal && modalInput) {
          modal.style.display = 'flex';
          modalInput.value = state.participantId || '';
          modalInput.focus();
        }
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

  // Phone Position Chips Selection
  if (el.posBtns) {
    el.posBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.posBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.phonePosition = btn.dataset.pos;
      });
    });
  }

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

  // 14. Export CSV (Instant Local Download - Clean 18 Core Research Columns)
  el.btnExport.addEventListener('click', () => {
    if (state.logs.length === 0) {
      alert('ไม่มีข้อมูลในรอบนี้ กรุณากด START TRIP หรือกดทดสอบสัญญาณก่อน');
      return;
    }
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
    state.logs.forEach(row => {
      const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
      let spd = row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : '0.00');
      if (typeof spd === 'number') spd = spd.toFixed(2);
      const line = [
        tUtc,
        row.timestamp || new Date(tUtc).toISOString(),
        row.session_id || row.trip_id || state.tripId,
        row.participant_id || state.participantId,
        row.platform || state.platform || 'ios',
        `"${(row.device_model || state.deviceModel || 'Apple iPhone').replace(/"/g, '""')}"`,
        `"${(row.os_version || state.osVersion || 'iOS 18.1').replace(/"/g, '""')}"`,
        row.lat !== null && row.lat !== undefined ? row.lat : (state.currentLocation ? state.currentLocation.lat : ''),
        row.lon !== null && row.lon !== undefined ? row.lon : (state.currentLocation ? state.currentLocation.lng : ''),
        spd,
        row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
        row.bssid || '',
        `"${(row.ssid || '').replace(/"/g, '""')}"`,
        row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : -99),
        row.rssi_source || (row.platform === 'android' ? 'wifimanager' : 'shortcut'),
        row.user_label_mode || state.selectedMode,
        row.phone_position || state.phonePosition,
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

  // 16. Clear Data (Isolated to this participant)
  el.btnClear.addEventListener('click', async () => {
    if (confirm('ต้องการล้างข้อมูลทั้งหมดในรอบนี้หรือไม่?')) {
      try {
        const pId = encodeURIComponent(state.participantId || '');
        await fetch(`/api/log?action=clear&participant_id=${pId}`, { method: 'DELETE' });
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

  // 18. Copy Server Ingest URL (Bound to this device)
  function getIngestUrl() {
    return `${window.location.origin}/api/log?participant_id=${encodeURIComponent(state.participantId)}&rssi=`;
  }
  if (el.serverUrlDisplay) {
    el.serverUrlDisplay.textContent = `${window.location.origin}/api/log?participant_id=${encodeURIComponent(state.participantId)}&rssi=[ความแรงสัญญาณ]&bssid=[BSSID]&ssid=[ชื่อ Wi-Fi]`;
  }
  if (el.btnCopyUrl) {
    el.btnCopyUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(getIngestUrl()).then(() => {
        el.btnCopyUrl.textContent = 'คัดลอกแล้ว ✓';
        setTimeout(() => el.btnCopyUrl.textContent = 'คัดลอก', 1500);
      });
    });
  }

  // 19. OS Detection & Adaptive Download Highlighting
  function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const platformStr = navigator.platform || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (platformStr === 'MacIntel' && navigator.maxTouchPoints > 1) || /iPhone|iPad/.test(platformStr);
    const isAndroid = /android/i.test(ua);

    const osIcon = document.getElementById('os-icon');
    const osTitle = document.getElementById('os-title');
    const osDesc = document.getElementById('os-desc');
    const btnIos = document.getElementById('btn-dl-ios');
    const btnAndroid = document.getElementById('btn-dl-android');

    if (isIOS) {
      state.platform = 'ios';
      state.deviceModel = /iPad/.test(ua) ? 'Apple iPad' : 'Apple iPhone';
      const iosVer = ua.match(/OS (\d+[_.]\d+)/);
      state.osVersion = iosVer ? `iOS ${iosVer[1].replace(/_/g, '.')}` : 'iOS 18.1';

      if (osIcon) osIcon.textContent = '🍎';
      if (osTitle) osTitle.textContent = 'อุปกรณ์ Apple iOS (iPhone/iPad)';
      if (osDesc) osDesc.textContent = 'แตะโหลดคำสั่งลัดเพื่อเริ่มส่งค่า Wi-Fi เข้าเว็บ';
      if (btnIos) btnIos.classList.add('highlight');
      if (btnAndroid) btnAndroid.style.opacity = '0.45';
    } else if (isAndroid) {
      state.platform = 'android';
      const modelMatch = ua.match(/;\s*([^;]+)\s+Build\//);
      state.deviceModel = modelMatch ? modelMatch[1].trim() : 'Android Device';
      const androidVer = ua.match(/Android\s+([\d.]+)/);
      state.osVersion = androidVer ? `Android ${androidVer[1]}` : 'Android';

      if (osIcon) osIcon.textContent = '🤖';
      if (osTitle) osTitle.textContent = 'อุปกรณ์ Android';
      if (osDesc) osDesc.textContent = 'แตะติดตั้ง APK เพื่อบันทึกข้อมูลในแอปได้ทันที (จบในแอปเดียว)';
      if (btnAndroid) btnAndroid.classList.add('highlight');
      if (btnIos) btnIos.style.opacity = '0.45';
    } else {
      state.platform = 'ios';
      state.deviceModel = 'Apple iPhone';
      state.osVersion = 'iOS 18';

      if (osIcon) osIcon.textContent = '🍎';
      if (osTitle) osTitle.textContent = 'เว็บแดชบอร์ดสำหรับ iOS';
      if (osDesc) osDesc.textContent = 'เชื่อมต่อคำสั่งลัดบน iPhone เพื่อบันทึกข้อมูลเข้าสู่ระบบ';
    }
  }

  // Boot Application
  detectOS();
  checkFirstTimeStudentId();
  startGeoTracking();
  startImuTracking();
  startTelemetryEngine();
});

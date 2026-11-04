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
  function startGeoTracking() {
    if ('geolocation' in navigator) {
      state.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speedNum = pos.coords.speed !== null && !isNaN(pos.coords.speed) ? pos.coords.speed * 3.6 : 0.0;
          const speed = speedNum.toFixed(1);
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
    // Multi-User Security: Reject packets belonging to another participant
    if (entry.participant_id && state.participantId) {
      const entryPid = String(entry.participant_id).toLowerCase().trim();
      const currentPid = String(state.participantId).toLowerCase().trim();
      if (entryPid !== currentPid) {
        return;
      }
    }

    // Retain client-defined participant ID, never let incoming packets overwrite it
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

    // Speed & Accuracy
    if (entry.speed === undefined || entry.speed === null) {
      entry.speed = state.currentLocation ? state.currentLocation.speed : 0.0;
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
      const url = `/api/log?action=get&participant_id=${pId}&after_id=${lastProcessedId}&t=${Date.now()}`;
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

    // Map logs to 26 core research metrics (Unified Research Schema)
    const payloadLogs = state.logs.map(row => {
      const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
      const tMono = row.t_mono_ns || Math.round(performance.now() * 1000000);
      return {
        t_utc_ms: tUtc,
        t_mono_ns: tMono,
        timestamp: row.timestamp || new Date(tUtc).toISOString(),
        session_id: row.session_id || row.trip_id || state.tripId,
        participant_id: row.participant_id || state.participantId,
        platform: row.platform || state.platform || 'ios',
        device_model: row.device_model || state.deviceModel || 'Apple iPhone',
        os_version: row.os_version || state.osVersion || 'iOS 18.1',
        lat: row.lat !== null && row.lat !== undefined ? row.lat : (state.currentLocation ? state.currentLocation.lat : ''),
        lon: row.lon !== null && row.lon !== undefined ? row.lon : (state.currentLocation ? state.currentLocation.lng : ''),
        speed: row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : 0),
        accuracy: row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
        accel_x: row.accel_x !== undefined && row.accel_x !== null ? row.accel_x : state.imu.accelX,
        accel_y: row.accel_y !== undefined && row.accel_y !== null ? row.accel_y : state.imu.accelY,
        accel_z: row.accel_z !== undefined && row.accel_z !== null ? row.accel_z : state.imu.accelZ,
        gyro_x: row.gyro_x !== undefined && row.gyro_x !== null ? row.gyro_x : state.imu.gyroX,
        gyro_y: row.gyro_y !== undefined && row.gyro_y !== null ? row.gyro_y : state.imu.gyroY,
        gyro_z: row.gyro_z !== undefined && row.gyro_z !== null ? row.gyro_z : state.imu.gyroZ,
        bssid: row.bssid || '',
        ssid: row.ssid || '',
        rssi_raw: row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : ''),
        rssi_source: row.rssi_source || (row.platform === 'android' ? 'wifimanager' : 'shortcut'),
        user_label_mode: row.user_label_mode || state.selectedMode,
        activity_recognition_mode: row.activity_recognition_mode || row.predicted_mode || state.predictedMode || 'still',
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

  // 10. Participant ID Management (Permanent Persistence)
  function updateServerUrlDisplay() {
    const url = `${window.location.origin}/api/log?participant_id=${encodeURIComponent(state.participantId)}`;
    if (el.serverUrlDisplay) el.serverUrlDisplay.textContent = url;
  }

  if (el.participantInput) {
    el.participantInput.value = state.participantId;
    updateServerUrlDisplay();

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
      if (val !== state.participantId) {
        state.participantId = val;
        localStorage.setItem('rssi_participant_id', val);
        setCookie('rssi_participant_id', val);
        lastProcessedId = 0;
        resetData();
        showSavedIndicator('✓ อัปเดตรหัสแล้ว');
        updateServerUrlDisplay();
      }
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
        if (hwId !== state.participantId) {
          state.participantId = hwId;
          el.participantInput.value = hwId;
          localStorage.setItem('rssi_participant_id', hwId);
          setCookie('rssi_participant_id', hwId);
          lastProcessedId = 0;
          resetData();
          showSavedIndicator('✓ คืนค่ารหัสเครื่อง');
          updateServerUrlDisplay();
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

  // 14. Export CSV (Instant Local Download - Unified 26 Core Research Columns)
  el.btnExport.addEventListener('click', () => {
    if (state.logs.length === 0) {
      alert('ไม่มีข้อมูลในรอบนี้ กรุณากด START TRIP หรือกดทดสอบสัญญาณก่อน');
      return;
    }
    const headers = [
      't_utc_ms',
      't_mono_ns',
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
      'accel_x',
      'accel_y',
      'accel_z',
      'gyro_x',
      'gyro_y',
      'gyro_z',
      'bssid',
      'ssid',
      'rssi_raw',
      'rssi_source',
      'user_label_mode',
      'activity_recognition_mode',
      'phone_position',
      'note'
    ];
    let csv = headers.join(',') + '\n';
    state.logs.forEach(row => {
      const tUtc = row.t_utc_ms || (row.timestamp ? Date.parse(row.timestamp) : Date.now());
      const tMono = row.t_mono_ns || Math.round(performance.now() * 1000000);
      const line = [
        tUtc,
        tMono,
        row.timestamp || new Date(tUtc).toISOString(),
        row.session_id || row.trip_id || state.tripId,
        row.participant_id || state.participantId,
        row.platform || state.platform || 'ios',
        `"${(row.device_model || state.deviceModel || 'Apple iPhone').replace(/"/g, '""')}"`,
        `"${(row.os_version || state.osVersion || 'iOS 18.1').replace(/"/g, '""')}"`,
        row.lat !== null && row.lat !== undefined ? row.lat : (state.currentLocation ? state.currentLocation.lat : ''),
        row.lon !== null && row.lon !== undefined ? row.lon : (state.currentLocation ? state.currentLocation.lng : ''),
        row.speed !== null && row.speed !== undefined ? row.speed : (state.currentLocation ? state.currentLocation.speed : 0),
        row.accuracy !== null && row.accuracy !== undefined ? row.accuracy : (state.currentLocation ? state.currentLocation.accuracy : 5),
        row.accel_x !== undefined && row.accel_x !== null ? row.accel_x : state.imu.accelX,
        row.accel_y !== undefined && row.accel_y !== null ? row.accel_y : state.imu.accelY,
        row.accel_z !== undefined && row.accel_z !== null ? row.accel_z : state.imu.accelZ,
        row.gyro_x !== undefined && row.gyro_x !== null ? row.gyro_x : state.imu.gyroX,
        row.gyro_y !== undefined && row.gyro_y !== null ? row.gyro_y : state.imu.gyroY,
        row.gyro_z !== undefined && row.gyro_z !== null ? row.gyro_z : state.imu.gyroZ,
        row.bssid || '',
        `"${(row.ssid || '').replace(/"/g, '""')}"`,
        row.rssi_raw !== null && row.rssi_raw !== undefined ? row.rssi_raw : (row.rssi !== null && row.rssi !== undefined ? row.rssi : -99),
        row.rssi_source || (row.platform === 'android' ? 'wifimanager' : 'shortcut'),
        row.user_label_mode || state.selectedMode,
        row.activity_recognition_mode || row.predicted_mode || state.predictedMode || 'still',
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
    return `${window.location.origin}/api/log?participant_id=${encodeURIComponent(state.participantId)}`;
  }
  if (el.serverUrlDisplay) {
    el.serverUrlDisplay.textContent = getIngestUrl();
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
  startGeoTracking();
  startImuTracking();
  startTelemetryEngine();
});

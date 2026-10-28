# -*- coding: utf-8 -*-
"""
Test script to simulate incoming Wi-Fi RSSI and GPS telemetry from iOS Shortcuts.
"""
import time
import random
import urllib.request
import urllib.parse
import json

SERVER_URL = "http://localhost:3000/api/log"

print(f"📡 Sending simulated telemetry pings to {SERVER_URL}...")
print("Press Ctrl+C to stop.")

samples = 0
try:
    while True:
        samples += 1
        rssi = random.randint(-85, -45)
        bssid = f"00:11:22:33:44:{random.randint(10, 99)}"
        ssid = "Test-Campus-WiFi"
        lat = 13.7563 + (random.random() - 0.5) * 0.005
        lng = 100.5018 + (random.random() - 0.5) * 0.005

        params = {
            "bssid": bssid,
            "ssid": ssid,
            "rssi": rssi,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "mode": "walk"
        }

        query_str = urllib.parse.urlencode(params)
        full_url = f"{SERVER_URL}?{query_str}"

        req = urllib.request.Request(full_url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode())
            print(f"[{samples}] Sent: RSSI={rssi} dBm, BSSID={bssid} -> Server count={res_data.get('count')}")

        time.sleep(1)
except KeyboardInterrupt:
    print(f"\nStopped. Total {samples} pings sent.")

package com.example.rssi_logger

import android.content.Context
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Handler
import android.os.Looper
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import android.provider.Settings
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val WIFI_CHANNEL = "com.example.rssi_logger/wifi_rssi"
    private val DEVICE_CHANNEL = "com.example.rssi_logger/device"
    private var eventSink: EventChannel.EventSink? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isPolling = false

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, DEVICE_CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "getAndroidHardwareId") {
                try {
                    val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: ""
                    result.success(androidId)
                } catch (e: Exception) {
                    result.success("")
                }
            } else {
                result.notImplemented()
            }
        }
        
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, WIFI_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events
                    startWifiPolling()
                }

                override fun onCancel(arguments: Any?) {
                    eventSink = null
                    stopWifiPolling()
                }
            }
        )
    }

    private fun startWifiPolling() {
        if (isPolling) return
        isPolling = true
        pollRunnable.run()
    }

    private fun stopWifiPolling() {
        isPolling = false
        handler.removeCallbacks(pollRunnable)
    }

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (!isPolling) return
            
            try {
                val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                val wifiInfo: WifiInfo? = wifiManager.connectionInfo
                
                if (wifiInfo != null && wifiInfo.networkId != -1) {
                    val rssi = wifiInfo.rssi
                    val bssid = wifiInfo.bssid ?: "unknown"
                    val ssid = wifiInfo.ssid?.replace("\"", "") ?: "unknown"
                    
                    val result = mapOf(
                        "rssi" to rssi,
                        "bssid" to bssid,
                        "ssid" to ssid
                    )
                    eventSink?.success(result)
                } else {
                    // Not connected to Wi-Fi
                    val result = mapOf(
                        "rssi" to 0,
                        "bssid" to "disconnected",
                        "ssid" to "disconnected"
                    )
                    eventSink?.success(result)
                }
            } catch (e: Exception) {
                // Ignore or log error
            }
            
            // Poll every 1 second
            handler.postDelayed(this, 1000)
        }
    }
}

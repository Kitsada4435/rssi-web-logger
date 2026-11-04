import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate, FlutterStreamHandler {
  private var wifiEventSink: FlutterEventSink?
  private let WIFI_CHANNEL = "com.example.rssi_logger/wifi_rssi"
  private var pendingWifiEvents: [[String: Any]] = []

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Note: GeneratedPluginRegistrant.register is handled in didInitializeImplicitFlutterEngine under UIScene lifecycle

    // Listen for AppIntent broadcasts from LogWifiSampleIntent
    NotificationCenter.default.addObserver(
      forName: NSNotification.Name("LogWifiSampleNotification"),
      object: nil,
      queue: .main
    ) { [weak self] notification in
      if let userInfo = notification.userInfo as? [String: Any] {
        self?.dispatchWifiSample(userInfo)
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WifiRssiPlugin") {
      let wifiChannel = FlutterEventChannel(name: WIFI_CHANNEL, binaryMessenger: registrar.messenger())
      wifiChannel.setStreamHandler(self)
    }
  }

  // Handle URL Scheme from Apple Shortcuts:
  // e.g. rssilogger://wifi?bssid=00:11:22:33:44:55&rssi=-60&ssid=HomeWiFi
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    return handleIncomingUrl(url)
  }

  @discardableResult
  func handleIncomingUrl(_ url: URL) -> Bool {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return false
    }

    if components.host == "wifi" || url.path.contains("wifi") {
      var bssid = "unknown"
      var ssid = "unknown"
      var rssi: Double = 0.0

      if let queryItems = components.queryItems {
        for item in queryItems {
          let name = item.name.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
          if (name == "bssid" || name == "bssi"), let val = item.value, !val.isEmpty {
            bssid = val
          }
          if (name == "ssid" || name == "ssi"), let val = item.value, !val.isEmpty {
            ssid = val
          }
          if name == "rssi", let val = item.value, let dVal = Double(val.trimmingCharacters(in: .whitespacesAndNewlines)) {
            rssi = dVal
          }
        }
      }

      let payload: [String: Any] = [
        "bssid": bssid,
        "ssid": ssid,
        "rssi": rssi
      ]
      dispatchWifiSample(payload)
      return true
    }

    return false
  }

  func dispatchWifiSample(_ sample: [String: Any]) {
    if let sink = wifiEventSink {
      sink(sample)
    } else {
      pendingWifiEvents.append(sample)
    }
  }

  // FlutterStreamHandler methods
  public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    self.wifiEventSink = events
    for sample in pendingWifiEvents {
      events(sample)
    }
    pendingWifiEvents.removeAll()
    return nil
  }

  public func onCancel(withArguments arguments: Any?) -> FlutterError? {
    self.wifiEventSink = nil
    return nil
  }
}


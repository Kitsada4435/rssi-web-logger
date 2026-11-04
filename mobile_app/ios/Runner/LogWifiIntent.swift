import AppIntents
import Foundation

@available(iOS 16.0, *)
struct LogWifiSampleIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Wi-Fi Sample"
    static var description = IntentDescription("บันทึกค่าสัญญาณ Wi-Fi จาก Shortcuts เข้าสู่ RSSI Logger")

    @Parameter(title: "SSID", description: "ชื่อเครือข่าย Wi-Fi")
    var ssid: String?

    @Parameter(title: "BSSID", description: "MAC Address ของ Access Point")
    var bssid: String?

    @Parameter(title: "RSSI", description: "ความแรงสัญญาณ Wi-Fi (dBm)")
    var rssi: Double?

    static var parameterSummary: some ParameterSummary {
        Summary("บันทึก Wi-Fi \(\.$ssid) BSSID: \(\.$bssid) RSSI: \(\.$rssi)")
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(
            name: NSNotification.Name("LogWifiSampleNotification"),
            object: nil,
            userInfo: [
                "ssid": ssid ?? "unknown",
                "bssid": bssid ?? "unknown",
                "rssi": rssi ?? 0.0
            ]
        )
        return .result()
    }
}

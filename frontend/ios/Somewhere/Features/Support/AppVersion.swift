import Foundation

enum AppVersion {
    static var version: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
    }
    static var build: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
    }
    static var shortLabel: String {
        "Версия " + version.split(separator: ".").prefix(2).joined(separator: ".")
    }
}

import SwiftUI

enum AboutMetadata: Equatable {
    case release(version: String, build: String?)
    case local
    case unavailable

    static var current: Self { resolve(Bundle.main.infoDictionary) }

    static func resolve(_ info: [String: Any]?) -> Self {
        guard let info else { return .unavailable }
        let version =
            (info["CFBundleShortVersionString"] as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !version.isEmpty else { return .local }
        let build = (info["CFBundleVersion"] as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return .release(
            version: version, build: build.flatMap { $0.isEmpty || $0 == "0" ? nil : $0 })
    }

    var versionLabel: String {
        switch self {
        case .release(let version, _): version
        case .local: String(localized: "Локальная сборка")
        case .unavailable: String(localized: "Недоступна")
        }
    }

    var build: String? {
        if case .release(_, let build) = self { return build }
        return nil
    }
}

private struct AboutMetadataKey: EnvironmentKey {
    static var defaultValue: AboutMetadata { .current }
}

extension EnvironmentValues {
    var aboutMetadata: AboutMetadata {
        get { self[AboutMetadataKey.self] }
        set { self[AboutMetadataKey.self] = newValue }
    }
}

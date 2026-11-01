import Foundation

// Only the QA application owns these directories and services. A scenario relaunch
// keeps its namespace; a different test clears the previous QA-only state.
@MainActor
enum UITestIsolation {
    static func prepare(namespace: UUID?, scenario: String, origin: APIOrigin) throws {
        guard Bundle.main.bundleIdentifier == "dev.groupplanning.ios.uitesthost",
            let namespace
        else { throw ClientFailure.invalidRequest }
        let root = URL.applicationSupportDirectory
        let marker = root.appendingPathComponent("UITestRun/namespace")
        if FileManager.default.fileExists(atPath: marker.path),
            try String(contentsOf: marker, encoding: .utf8) == namespace.uuidString
        {
            return
        }

        for name in ["UITestDrafts", "UITestLinks", "UITestChatOutbox"] {
            let directory = root.appendingPathComponent(name, isDirectory: true)
            if FileManager.default.fileExists(atPath: directory.path) {
                try FileManager.default.removeItem(at: directory)
            }
        }
        try KeychainCredentialStorage(
            origin: origin, service: "dev.groupplanning.ui." + scenario
        ).remove()
        try KeychainAuthAttemptStorage(
            origin: origin, service: "dev.groupplanning.ui.auth." + scenario
        ).clear()
        UserDefaults.standard.removePersistentDomain(
            forName: "dev.groupplanning.ios.uitesthost")
        try FileManager.default.createDirectory(
            at: marker.deletingLastPathComponent(), withIntermediateDirectories: true)
        try Data(namespace.uuidString.utf8).write(to: marker, options: .atomic)
    }
}

import Foundation

// Only a public invitation token is stored here, never a session or OAuth verifier.
actor PendingInvitationStore {
    private let file: URL
    private var version = -1
    init(file: URL) { self.file = file }

    func load() throws -> String? {
        guard FileManager.default.fileExists(atPath: file.path) else { return nil }
        let token = try String(contentsOf: file, encoding: .utf8)
        guard InvitationURL.valid(token) else { throw ClientFailure.invalidRequest }
        return token
    }

    func save(_ token: String?, version: Int) throws {
        try Task.checkCancellation()
        guard version >= self.version else { return }
        self.version = version
        guard let token else {
            if FileManager.default.fileExists(atPath: file.path) {
                try FileManager.default.removeItem(at: file)
            }
            return
        }
        guard InvitationURL.valid(token) else { throw ClientFailure.invalidRequest }
        try FileManager.default.createDirectory(
            at: file.deletingLastPathComponent(), withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.complete])
        try Data(token.utf8).write(to: file, options: [.atomic, .completeFileProtection])
        var excluded = file
        var options = URLResourceValues()
        options.isExcludedFromBackup = true
        try excluded.setResourceValues(options)
    }
}

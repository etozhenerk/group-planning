import Foundation

struct FileDraftStorage: DraftPersistence {
    let directory: URL

    func load(owner: UUID) throws -> DraftRecord? {
        let url = file(owner)
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        return try JSONDecoder().decode(DraftRecord.self, from: Data(contentsOf: url))
    }

    func save(_ record: DraftRecord) throws {
        try FileManager.default.createDirectory(
            at: directory, withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.complete])
        let url = file(record.ownerID)
        try JSONEncoder().encode(record).write(
            to: url, options: [.atomic, .completeFileProtection])
        var excluded = url
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try excluded.setResourceValues(values)
    }

    func remove(owner: UUID) throws {
        let url = file(owner)
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }

    private func file(_ owner: UUID) -> URL {
        directory.appendingPathComponent(owner.uuidString.lowercased()).appendingPathExtension(
            "json")
    }
}

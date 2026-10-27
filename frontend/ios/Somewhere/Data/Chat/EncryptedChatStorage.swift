import CryptoKit
import Foundation

struct EncryptedChatStorage: ChatPersistence {
    let directory: URL
    let keys: KeychainChatKeys

    func load(owner: UUID, meeting: UUID) throws -> ChatLocalRecord? {
        let url = file(owner: owner, meeting: meeting)
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        guard let key = try keys.load(owner: owner) else { throw ChatStorageFailure.missingKey }
        let sealed = try AES.GCM.SealedBox(combined: Data(contentsOf: url))
        let data = try AES.GCM.open(sealed, using: key, authenticating: context(owner, meeting))
        let record = try JSONDecoder().decode(ChatLocalRecord.self, from: data)
        try record.validate(owner: owner, meeting: meeting)
        return record
    }

    func save(_ record: ChatLocalRecord) throws {
        try record.validate(owner: record.ownerID, meeting: record.meetingID)
        let key = try keys.loadOrCreate(owner: record.ownerID)
        let data = try JSONEncoder().encode(record)
        let sealed = try AES.GCM.seal(
            data, using: key, authenticating: context(record.ownerID, record.meetingID))
        guard let combined = sealed.combined else { throw ChatStorageFailure.invalidRecord }
        var folder = accountDirectory(record.ownerID)
        try FileManager.default.createDirectory(
            at: folder, withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.complete])
        var excluded = URLResourceValues()
        excluded.isExcludedFromBackup = true
        try folder.setResourceValues(excluded)
        try combined.write(
            to: file(owner: record.ownerID, meeting: record.meetingID),
            options: [.atomic, .completeFileProtection])
    }

    func remove(owner: UUID, meeting: UUID) throws {
        try removeIfPresent(file(owner: owner, meeting: meeting))
    }

    func removeAccount(_ owner: UUID) throws {
        try removeIfPresent(accountDirectory(owner))
        try keys.remove(owner: owner)
    }

    private func file(owner: UUID, meeting: UUID) -> URL {
        accountDirectory(owner).appendingPathComponent(meeting.uuidString.lowercased())
            .appendingPathExtension("sealed")
    }

    private func accountDirectory(_ owner: UUID) -> URL {
        let namespace = SHA256.hash(data: Data(keys.origin.url.absoluteString.utf8))
            .map { String(format: "%02x", $0) }.joined()
        return directory.appendingPathComponent(namespace, isDirectory: true)
            .appendingPathComponent(owner.uuidString.lowercased(), isDirectory: true)
    }

    private func context(_ owner: UUID, _ meeting: UUID) -> Data {
        Data(
            ("somewhere.chat.v1|" + keys.origin.url.absoluteString + "|"
                + owner.uuidString.lowercased() + "|" + meeting.uuidString.lowercased()).utf8)
    }

    private func removeIfPresent(_ url: URL) throws {
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }
}

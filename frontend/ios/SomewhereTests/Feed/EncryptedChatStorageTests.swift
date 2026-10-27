import CryptoKit
import Foundation
import Testing

@testable import Somewhere

struct EncryptedChatStorageTests {
    @Test func restartRestoresIntentWithoutPlaintextAndUsesFreshNonce() throws {
        let owner = UUID()
        let meeting = UUID()
        let directory = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let origin = try APIOrigin(try #require(URL(string: "https://chat-storage.example")))
        let keys = KeychainChatKeys(origin: origin, service: "chat-test-" + UUID().uuidString)
        let storage = EncryptedChatStorage(directory: directory, keys: keys)
        defer {
            try? storage.removeAccount(owner)
            try? FileManager.default.removeItem(at: directory)
        }
        let intent = OutgoingMessage(
            id: UUID(), text: "Текст исходящего сообщения", createdAt: Date(), status: .uncertain)
        let record = ChatLocalRecord(
            ownerID: owner, meetingID: meeting, draft: "Новый черновик", outgoing: [intent])
        try storage.save(record)
        let file = try #require(sealedFiles(directory).first)
        let first = try Data(contentsOf: file)
        #expect(!String(decoding: first, as: UTF8.self).contains(intent.text))
        #expect(!String(decoding: first, as: UTF8.self).contains(record.draft))
        let restored = try EncryptedChatStorage(directory: directory, keys: keys)
            .load(owner: owner, meeting: meeting)
        #expect(restored == record)
        try storage.save(record)
        #expect(try Data(contentsOf: file) != first)
        #expect(
            try file.deletingLastPathComponent().resourceValues(forKeys: [.isExcludedFromBackupKey])
                .isExcludedFromBackup == true)
    }

    @Test func authenticationRejectsTamperingAndMovingToAnotherMeeting() throws {
        let owner = UUID()
        let meeting = UUID()
        let other = UUID()
        let directory = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let origin = try APIOrigin(try #require(URL(string: "https://chat-storage.example")))
        let keys = KeychainChatKeys(origin: origin, service: "chat-test-" + UUID().uuidString)
        let storage = EncryptedChatStorage(directory: directory, keys: keys)
        defer {
            try? storage.removeAccount(owner)
            try? FileManager.default.removeItem(at: directory)
        }
        try storage.save(ChatLocalRecord(ownerID: owner, meetingID: meeting, draft: "private"))
        let file = try #require(sealedFiles(directory).first)
        let copied = file.deletingLastPathComponent()
            .appendingPathComponent(other.uuidString.lowercased()).appendingPathExtension("sealed")
        try FileManager.default.copyItem(at: file, to: copied)
        #expect(throws: (any Error).self) { try storage.load(owner: owner, meeting: other) }
        var data = try Data(contentsOf: file)
        data[data.startIndex + 15] ^= 1
        try data.write(to: file)
        #expect(throws: (any Error).self) { try storage.load(owner: owner, meeting: meeting) }
    }

    @Test func accountRemovalPreservesOtherAccountAndRemovesEncryptionKey() throws {
        let owner = UUID()
        let other = UUID()
        let meeting = UUID()
        let directory = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let origin = try APIOrigin(try #require(URL(string: "https://chat-storage.example")))
        let keys = KeychainChatKeys(origin: origin, service: "chat-test-" + UUID().uuidString)
        let storage = EncryptedChatStorage(directory: directory, keys: keys)
        defer {
            try? storage.removeAccount(owner)
            try? storage.removeAccount(other)
            try? FileManager.default.removeItem(at: directory)
        }
        let second = ChatLocalRecord(ownerID: other, meetingID: meeting, draft: "other")
        try storage.save(ChatLocalRecord(ownerID: owner, meetingID: meeting, draft: "first"))
        try storage.save(second)
        try storage.removeAccount(owner)
        #expect(try keys.load(owner: owner) == nil)
        #expect(try storage.load(owner: owner, meeting: meeting) == nil)
        #expect(try storage.load(owner: other, meeting: meeting) == second)
    }

    @Test(
        .enabled(
            if: EncryptedChatStorageTests.hasDeviceFileProtection,
            "Complete file protection must be verified on a physical iOS device."))
    func encryptedFileUsesCompleteDeviceProtection() throws {
        let owner = UUID()
        let directory = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let origin = try APIOrigin(try #require(URL(string: "https://chat-storage.example")))
        let keys = KeychainChatKeys(origin: origin, service: "chat-test-" + UUID().uuidString)
        let storage = EncryptedChatStorage(directory: directory, keys: keys)
        defer {
            try? storage.removeAccount(owner)
            try? FileManager.default.removeItem(at: directory)
        }
        try storage.save(ChatLocalRecord(ownerID: owner, meetingID: UUID(), draft: "protected"))
        let file = try #require(sealedFiles(directory).first)
        let attributes = try FileManager.default.attributesOfItem(atPath: file.path)
        let protection =
            attributes[.protectionKey] as? String
            ?? (attributes[.protectionKey] as? FileProtectionType)?.rawValue
        #expect(protection == FileProtectionType.complete.rawValue)
    }

    private static var hasDeviceFileProtection: Bool {
        #if targetEnvironment(simulator)
            false
        #else
            true
        #endif
    }

    private func sealedFiles(_ directory: URL) throws -> [URL] {
        let enumerator = try #require(
            FileManager.default.enumerator(at: directory, includingPropertiesForKeys: nil))
        return enumerator.compactMap { $0 as? URL }.filter { $0.pathExtension == "sealed" }
    }
}

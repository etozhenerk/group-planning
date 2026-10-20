import Foundation
import Testing

@testable import Somewhere

struct DraftRepositoryTests {
    @Test func profilesAndOldOwnersStayIsolated() async throws {
        let storage = MemoryDraftStorage()
        let repository = DraftRepository(storage: storage)
        let first = UUID()
        let second = UUID()
        let record = DraftRecord(ownerID: first, value: MeetingDraftTests.filled())
        let (lease, _) = try await repository.open(owner: first)
        try await repository.save(record, lease: lease)
        let (_, other) = try await repository.open(owner: second)
        #expect(other == nil)
        await #expect(throws: ClientFailure.staleSession) {
            try await repository.save(record, lease: lease)
        }
        let (next, saved) = try await repository.open(owner: first)
        #expect(saved == record)
        try await repository.remove(owner: first, lease: next)
        #expect(try storage.load(owner: first) == nil)
    }
    @Test func fileSurvivesRepositoryRecreationWithoutSessionSecret() async throws {
        let directory = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let storage = FileDraftStorage(directory: directory)
        var record = DraftRecord(ownerID: UUID(), value: MeetingDraftTests.filled())
        record.submission = try record.value.input()
        try storage.save(record)
        let (_, restored) = try await DraftRepository(storage: storage).open(owner: record.ownerID)
        #expect(restored == record)
        let files = try FileManager.default.contentsOfDirectory(
            at: directory, includingPropertiesForKeys: nil)
        let data = try Data(contentsOf: #require(files.first))
        #expect(!String(decoding: data, as: UTF8.self).contains("session_token"))
        try storage.remove(owner: record.ownerID)
        #expect(try storage.load(owner: record.ownerID) == nil)
    }
}

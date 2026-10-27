import Foundation
import Testing

@testable import Somewhere

struct ChatRepositoryTests {
    @Test func restartRetainsOrderIDsAndDraftAndMarksSendingUncertain() async throws {
        let storage = MemoryChatStorage()
        let owner = UUID()
        let meeting = UUID()
        let first = ChatRepository(storage: storage)
        let (lease, _) = try await first.open(owner: owner, meeting: meeting, generation: 1)
        let a = OutgoingMessage(id: UUID(), text: "Первое", createdAt: Date(), status: .queued)
        let b = OutgoingMessage(id: UUID(), text: "Второе", createdAt: Date(), status: .queued)
        try await first.enqueue(a, draftRevision: 0, lease: lease)
        try await first.status(.sending, id: a.id, lease: lease)
        try await first.enqueue(b, draftRevision: 0, lease: lease)
        try await first.draft("Ещё пишу", revision: 1, lease: lease)
        let restarted = ChatRepository(storage: storage)
        let (_, record) = try await restarted.open(owner: owner, meeting: meeting, generation: 1)
        #expect(record.draft == "Ещё пишу")
        #expect(record.outgoing.map(\.id) == [a.id, b.id])
        #expect(record.outgoing.map(\.status) == [.uncertain, .queued])
    }

    @Test func oldDraftAndOldLeaseCannotResurrectRemovedOrNewAccountData() async throws {
        let storage = MemoryChatStorage()
        let repository = ChatRepository(storage: storage)
        let owner = UUID()
        let meeting = UUID()
        let other = UUID()
        let (old, _) = try await repository.open(owner: owner, meeting: meeting, generation: 1)
        try await repository.draft("Новый текст", revision: 4, lease: old)
        try await repository.draft("Старый", revision: 2, lease: old)
        #expect(try storage.load(owner: owner, meeting: meeting)?.draft == "Новый текст")
        try await repository.invalidate(owner: owner, generation: 2, erase: true)
        let (current, _) = try await repository.open(owner: other, meeting: meeting, generation: 3)
        try await repository.draft("Другой аккаунт", revision: 1, lease: current)
        await #expect(throws: ClientFailure.staleSession) {
            try await repository.draft("Секрет", revision: 99, lease: old)
        }
        try await repository.invalidate(owner: owner, generation: 2, erase: true)
        #expect(try storage.load(owner: other, meeting: meeting)?.draft == "Другой аккаунт")
    }

    @Test func newerDraftSurvivesSlowEnqueueAndRevokeRejectsOldWriter() async throws {
        let storage = MemoryChatStorage()
        let owner = UUID()
        let meeting = UUID()
        let repository = ChatRepository(storage: storage)
        let (lease, _) = try await repository.open(owner: owner, meeting: meeting, generation: 1)
        try await repository.draft("Новое", revision: 2, lease: lease)
        let message = OutgoingMessage(
            id: UUID(), text: "Отправляем", createdAt: Date(), status: .queued)
        try await repository.enqueue(message, draftRevision: 1, lease: lease)
        #expect(try storage.load(owner: owner, meeting: meeting)?.draft == "Новое")
        try await repository.revoke(owner: owner, meeting: meeting, generation: 1)
        await #expect(throws: ClientFailure.staleSession) {
            try await repository.enqueue(message, draftRevision: 3, lease: lease)
        }
        #expect(try storage.load(owner: owner, meeting: meeting) == nil)
    }
}

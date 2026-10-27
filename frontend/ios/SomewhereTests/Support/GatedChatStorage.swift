import Foundation
import os

@testable import Somewhere

// A bounded slow disk operation, executed by ChatRepository off MainActor.
final class GatedChatStorage: ChatPersistence, Sendable {
    private let base = MemoryChatStorage()
    private let started = OSAllocatedUnfairLock(initialState: false)
    private let resume = DispatchSemaphore(value: 0)
    func load(owner: UUID, meeting: UUID) throws -> ChatLocalRecord? {
        try base.load(owner: owner, meeting: meeting)
    }
    func save(_ record: ChatLocalRecord) throws { try base.save(record) }
    func remove(owner: UUID, meeting: UUID) throws {
        try base.remove(owner: owner, meeting: meeting)
    }
    func removeAccount(_ owner: UUID) throws {
        started.withLock { $0 = true }
        guard resume.wait(timeout: .now() + 5) == .success else {
            throw ClientFailure.invalidRequest
        }
        try base.removeAccount(owner)
    }
    func waitUntilCleanup() async throws {
        for _ in 0..<200 {
            if started.withLock({ $0 }) { return }
            try await Task.sleep(for: .milliseconds(10))
        }
        throw ClientFailure.invalidRequest
    }
    func finishCleanup() { resume.signal() }
}

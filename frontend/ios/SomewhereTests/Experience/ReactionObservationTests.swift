import Foundation
import Observation
import Testing

@testable import Somewhere

@Suite("Reaction pending state")
@MainActor
struct ReactionObservationTests {
    @Test func confirmingAnOptimisticReactionNotifiesPendingObservers() async throws {
        let context = try await FeedTestContext()
        let owner = context.owner.reactions
        defer { owner.suspend() }
        let entry = try context.entry("1")
        let path = context.path + "/messages/" + entry.id.uuidString.lowercased() + "/reactions"
        let gate = TestGate()
        let confirmed = [
            MessageReaction(emoji: "🍕", count: 1, mine: true, users: [try context.user])
        ]
        let reactions = String(decoding: try APICoding.encode(confirmed), as: UTF8.self)
        let response = Data("{\"entry_id\":\"\(entry.id)\",\"reactions\":\(reactions)}".utf8)
        await context.harness.transport.enqueue(path, data: response, gate: gate)
        owner.toggle("🍕", entryID: entry.id)
        try await context.harness.transport.waitFor(path)
        #expect(owner.isUpdating(entry.id))
        #expect(owner.values[entry.id] == confirmed)
        let signal = PendingSignal()
        withObservationTracking {
            _ = owner.isUpdating(entry.id)
        } onChange: {
            Task { await signal.notify() }
        }
        await gate.release()
        for _ in 0..<100 {
            if await signal.notified { break }
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(await signal.notified)
        #expect(!owner.isUpdating(entry.id))
        #expect(owner.values[entry.id] == confirmed)
    }

    private actor PendingSignal {
        private(set) var notified = false
        func notify() { notified = true }
    }
}

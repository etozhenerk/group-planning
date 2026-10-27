import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatOutboxTests {
    @Test func storageFailureKeepsDraftAndDoesNotPost() async throws {
        let context = try await FeedTestContext(storage: MemoryChatStorage(fails: true))
        context.owner.loaded = true
        context.owner.draft = "Сохрани меня"
        #expect(await context.owner.enqueue() == nil)
        #expect(context.owner.draft == "Сохрани меня" && context.owner.outgoing.isEmpty)
        #expect(context.owner.storageProblem != nil)
        #expect(await context.harness.transport.count(context.path + "/messages") == 0)
    }

    @Test func onlyOldestUncertainCanSendAndOtherIntentWaits() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "Первое"
        let first = try #require(await context.owner.enqueue())
        context.owner.draft = "Второе"
        let second = try #require(await context.owner.enqueue())
        await context.owner.transmit(second)
        #expect(await context.harness.transport.count(context.path + "/messages") == 0)
        await context.harness.transport.enqueue(context.path + "/messages", status: 503)
        await context.owner.transmit(first)
        await context.owner.transmit(second)
        #expect(await context.harness.transport.count(context.path + "/messages") == 1)
        #expect(context.owner.outgoing.map(\.id) == [first, second])
        #expect(context.owner.outgoing.first?.status == .uncertain)
    }

    @Test func wrongACKDoesNotEraseIntentOrMoveReceiveCursor() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.cursor = try ServerCounter("100")
        context.owner.draft = "Содержимое"
        let key = try #require(await context.owner.enqueue())
        let wrong = try context.entry("102", key: key, text: "Другое")
        await context.harness.transport.enqueue(
            context.path + "/messages",
            data: try APICoding.encode(wrong), status: 201)
        await context.owner.transmit(key)
        #expect(context.owner.pending.map(\.id) == [key])
        #expect(context.owner.entries.isEmpty)
        #expect(context.owner.cursor?.rawValue == "100")
    }
}

import Foundation
import Testing

@testable import Somewhere

@MainActor
struct FeedOwnerTests {
    @Test func cursorUsesReadEntriesNotMetadataOrPostAndHistoryDoesNotMoveIt() async throws {
        let context = try await FeedTestContext()
        let first = try context.entry("50")
        try await context.enqueue([first], more: true)
        await context.owner.refresh()
        #expect(context.owner.hasHistory)
        context.owner.draft = "Позднее сообщение"
        let key = try #require(context.owner.enqueue())
        let posted = try context.entry("53", key: key, text: "Позднее сообщение")
        await context.harness.transport.enqueue(
            context.path + "/messages", data: try APICoding.encode(posted), status: 201)
        await context.owner.transmit(key)
        let middle = try context.entry("51")
        try await context.enqueue([middle], more: true)
        try await context.enqueue([try context.entry("52"), posted])
        await context.owner.refresh()
        #expect(context.owner.entries.map(\.sequence.rawValue) == ["50", "51", "52", "53"])
        let older = try context.entry("49")
        try await context.enqueue([older])
        await context.owner.history()
        #expect(context.owner.entries.first == older && !context.owner.hasHistory)
        try await context.enqueue([])
        await context.owner.refresh()
        let requests = await context.harness.transport.requests.filter {
            $0.url?.path.hasSuffix("/feed") == true
        }
        let queries = requests.map { $0.url?.query ?? "" }
        #expect(queries[1].contains("after_sequence=50"))
        #expect(queries[2].contains("after_sequence=51"))
        #expect(queries[3].contains("before_sequence=50"))
        #expect(queries[4].contains("after_sequence=53"))
    }
    @Test func emptyInitialPageStartsIncrementalReadsAtZero() async throws {
        let context = try await FeedTestContext()
        try await context.enqueue([])
        await context.owner.refresh()
        try await context.enqueue([try context.entry("1")])
        await context.owner.refresh()
        #expect(
            await context.harness.transport.requests.last?.url?.query?.contains("after_sequence=0")
                == true)
    }
    @Test func retryRetainsBodyAndIDAndPollingReconcilesLostResponse() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "  Принесу игры\nи чай  "
        let key = try #require(context.owner.enqueue())
        await context.harness.transport.enqueue(context.path + "/messages", status: 503)
        await context.owner.transmit(key)
        #expect(context.owner.pending.first?.status == .uncertain)
        let entry = try context.entry("1", key: key, text: "  Принесу игры\nи чай  ")
        await context.harness.transport.enqueue(
            context.path + "/messages", data: try APICoding.encode(entry), status: 201)
        await context.owner.transmit(key)
        let posts = await context.harness.transport.requests.filter { $0.httpMethod == "POST" }
        #expect(posts.count == 2 && posts.first?.httpBody == posts.last?.httpBody)
        #expect(
            posts.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == posts.last?.value(forHTTPHeaderField: "Idempotency-Key"))
        try await context.enqueue([entry])
        await context.owner.refresh()
        #expect(context.owner.pending.isEmpty && context.owner.entries == [entry])
        context.owner.draft = "Другой текст"
        let next = try #require(context.owner.enqueue())
        await context.harness.transport.enqueue(context.path + "/messages", status: 503)
        await context.owner.transmit(next)
        try await context.enqueue([try context.entry("2", key: next, text: "Другой текст")])
        await context.owner.refresh()
        #expect(context.owner.pending.isEmpty && context.owner.entries.count == 2)
    }
    @Test func backgroundCancelsLateReadButPreservesDraftAndUncertainIntent() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "Отправка"
        let key = try #require(context.owner.enqueue())
        let gate = TestGate()
        let entry = try context.entry("1", key: key, text: "Отправка")
        await context.harness.transport.enqueue(
            context.path + "/messages", data: try APICoding.encode(entry), status: 201, gate: gate)
        let sending = Task { await context.owner.transmit(key) }
        try await context.harness.transport.waitFor(context.path + "/messages")
        context.owner.draft = "Ещё пишу"
        context.owner.suspend()
        await gate.release()
        await sending.value
        #expect(
            context.owner.pending.first?.status == .uncertain && context.owner.draft == "Ещё пишу")
        #expect(context.owner.entries.isEmpty)
        try await context.enqueue([entry])
        await context.owner.refresh()
        #expect(context.owner.pending.isEmpty && context.owner.entries == [entry])
        #expect(await context.harness.transport.count(context.path + "/messages") == 1)
    }
    @Test(arguments: [401, 403]) func forbiddenOrExpiredSessionPurgesAndRejectsLateSend(status: Int)
        async throws
    {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "Секрет"
        let key = try #require(context.owner.enqueue())
        let gate = TestGate()
        await context.harness.transport.enqueue(
            context.path + "/messages",
            data: try APICoding.encode(context.entry("1", key: key, text: "Секрет")), status: 201,
            gate: gate)
        let pending = Task { await context.owner.transmit(key) }
        try await context.harness.transport.waitFor(context.path + "/messages")
        await context.harness.transport.enqueue(context.path + "/feed", status: status)
        await context.owner.refresh()
        await gate.release()
        await pending.value
        #expect(
            !context.owner.current && context.owner.entries.isEmpty && context.owner.pending.isEmpty
        )
        #expect(
            context.owner.records.isEmpty && context.owner.outgoing.isEmpty
                && context.owner.draft.isEmpty)
        #expect(context.harness.session.privateData.feeds[context.id] == nil)
    }
    @Test func historyDoesNotAppearAfterAccessLeaseChanges() async throws {
        let context = try await FeedTestContext()
        try await context.enqueue([try context.entry("50")], more: true)
        await context.owner.refresh()
        let gate = TestGate()
        try await context.enqueue([try context.entry("1")], gate: gate)
        let pending = Task { await context.owner.history() }
        try await context.harness.transport.waitFor(context.path + "/feed", count: 2)
        context.harness.session.updateMeetingAccess(context.id, allowed: false)
        context.harness.session.updateMeetingAccess(context.id, allowed: true)
        await gate.release()
        await pending.value
        #expect(!context.owner.current && context.owner.entries.isEmpty)
    }
    @Test func unknownEventVersionIsSafeAndDoesNotExposeItsPayload() throws {
        let entry = try FeedEntry(
            id: UUID(), meetingID: UUID(), sequence: .zero, kind: "message", payloadVersion: 2,
            actor: UserProfile(id: UUID(), displayName: "Саша"),
            occurredAt: APIInstant("2026-10-21T12:00:00Z"),
            payload: ["text": .string("<script>secret</script>")], clientRequestID: nil)
        #expect(entry.messageText == nil)
        #expect(FeedPresentation.event(entry) == "Событие пока не поддерживается")
    }
}

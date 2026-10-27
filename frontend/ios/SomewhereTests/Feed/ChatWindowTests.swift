import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatWindowTests {
    @Test func windowStaysBoundedAndPreservesReaderAndPending() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        let entries = try (1...800).map { try context.entry(String($0)) }
        try context.owner.merge(entries)
        context.owner.anchorID = entries[300].id
        context.owner.draft = "Исходящее"
        let intent = try #require(await context.owner.enqueue())
        context.owner.trimWindow()
        #expect(context.owner.records.count == 500)
        #expect(context.owner.records.contains(where: { $0.id == entries[300].id }))
        #expect(context.owner.hasHistory && context.owner.hasNewer)
        #expect(context.owner.pending.map(\.id) == [intent])
    }

    @Test func receivedWrongOwnIntentCannotHidePending() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "Первоначально"
        let key = try #require(await context.owner.enqueue())
        let wrong = try context.entry("1", key: key, text: "Иное")
        #expect(throws: ClientFailure.invalidResponse) { try context.owner.merge([wrong]) }
        #expect(context.owner.pending.map(\.id) == [key])
        #expect(context.owner.records.isEmpty)
    }

    @Test func mediaOrMalformedAttachmentsCannotAcknowledgePlainText() async throws {
        let context = try await FeedTestContext()
        context.owner.loaded = true
        context.owner.draft = "Текст"
        let key = try #require(await context.owner.enqueue())
        let valid = try context.entry("1", key: key, text: "Текст")
        for attachment in [JSONValue.array([.object([:])]), .object([:]), .null] {
            let wrong = FeedEntry(
                id: valid.id, meetingID: valid.meetingID, sequence: valid.sequence,
                kind: valid.kind, payloadVersion: valid.payloadVersion, actor: valid.actor,
                occurredAt: valid.occurredAt,
                payload: ["text": .string("Текст"), "attachments": attachment],
                clientRequestID: key)
            #expect(throws: ClientFailure.invalidResponse) { try context.owner.merge([wrong]) }
            context.owner.records = [wrong]
            #expect(context.owner.timeline.count == 2)
            context.owner.records = []
            #expect(context.owner.pending.map(\.id) == [key])
        }
        try context.owner.merge([valid])
        #expect(context.owner.pending.isEmpty)
    }

    @Test func uint64BoundaryRemainsExact() throws {
        #expect(try ServerCounter("18446744073709551615") > ServerCounter("9007199254740993"))
        #expect(throws: ClientFailure.invalidResponse) { try ServerCounter("18446744073709551616") }
        #expect(throws: ClientFailure.invalidResponse) {
            try ServerCounter("100000000000000000000")
        }
    }
}

import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatSyncTests {
    @Test func snapshotAndChangeCursorStayIndependentFromOwnACK() async throws {
        let context = try await FeedTestContext()
        let epoch = UUID()
        context.owner.capabilities = ChatCapabilities(
            protocolVersion: 1, sync: true, readState: false, realtime: true)
        let first = try context.entry("100")
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try snapshot(context, epoch: epoch, entries: [first]))
        await context.owner.refresh()
        #expect(context.owner.changeCursor == "snapshot.cursor")
        #expect(context.owner.cursor == nil)
        context.owner.draft = "Моё"
        let intent = try #require(await context.owner.enqueue())
        let localKey = try #require(context.owner.timeline.last?.id)
        let mine = try context.entry("102", key: intent, text: "Моё")
        await context.harness.transport.enqueue(
            context.path + "/messages",
            data: try APICoding.encode(mine), status: 201)
        await context.owner.transmit(intent)
        #expect(context.owner.timeline.last?.id == localKey)
        #expect(context.owner.changeCursor == "snapshot.cursor")
        let middle = try context.entry("101")
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try changes(context, epoch: epoch, entries: [middle, mine]))
        await context.owner.refresh()
        #expect(context.owner.records.map(\.sequence.rawValue) == ["100", "101", "102"])
        #expect(context.owner.changeCursor == "changes.cursor")
        #expect(context.owner.pending.isEmpty)
    }

    @Test func snapshotSubscribeRaceCatchesUpAndIdleDoesNotPoll() async throws {
        let context = try await FeedTestContext()
        let epoch = UUID()
        context.owner.capabilities = ChatCapabilities(
            protocolVersion: 1, sync: true, readState: false, realtime: true)
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try snapshot(context, epoch: epoch, entries: []))
        await context.owner.refresh()
        context.owner.active = true
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try changes(context, epoch: epoch, entries: [context.entry("1")]))
        context.owner.receive(.subscribed)
        try await context.harness.transport.waitFor(context.path + "/sync", count: 2)
        await context.owner.hintTask?.value
        #expect(context.owner.records.count == 1 && context.owner.realtimeReady)
        try await Task.sleep(for: .milliseconds(150))
        #expect(await context.harness.transport.count(context.path + "/sync") == 2)
        #expect(context.owner.fallbackTask == nil)
        context.owner.suspend()
    }

    @Test func invalidProjectionCannotAdvanceCursorOrPartiallyMergePage() async throws {
        let context = try await FeedTestContext()
        let epoch = UUID()
        context.owner.capabilities = ChatCapabilities(
            protocolVersion: 1, sync: true, readState: false, realtime: false)
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try snapshot(context, epoch: epoch, entries: []))
        await context.owner.refresh()
        var wrong = try json(context.entry("2"))
        wrong["meeting_id"] = UUID().uuidString
        var page = try changesObject(context, epoch: epoch, entries: [context.entry("1")])
        page["changes"] =
            (page["changes"] as? [[String: Any]] ?? []) + [
                [
                    "kind": "entry_upsert", "projection_version": "2",
                    "projection": [
                        "resource_kind": "entry", "resource_id": try #require(wrong["id"]),
                        "projection_version": "2", "entry": wrong,
                    ],
                ]
            ]
        await context.harness.transport.enqueue(
            context.path + "/sync",
            data: try JSONSerialization.data(withJSONObject: page))
        await context.owner.refresh()
        #expect(context.owner.records.isEmpty)
        #expect(context.owner.changeCursor == "snapshot.cursor")
    }

    @Test func successfulCatchupStopsTemporaryFallbackOnExistingSubscription() async throws {
        let context = try await FeedTestContext()
        let epoch = UUID()
        context.owner.capabilities = ChatCapabilities(
            protocolVersion: 1, sync: true, readState: false, realtime: true)
        await context.harness.transport.enqueue(
            context.path + "/sync", data: try snapshot(context, epoch: epoch, entries: []))
        await context.owner.refresh()
        context.owner.active = true
        context.owner.subscriptionReady = true
        await context.harness.transport.enqueue(context.path + "/sync", status: 503)
        await context.owner.refresh()
        #expect(!context.owner.realtimeReady && context.owner.fallbackTask != nil)
        await context.harness.transport.enqueue(
            context.path + "/sync", data: try changes(context, epoch: epoch, entries: []))
        await context.owner.refresh()
        #expect(context.owner.realtimeReady && context.owner.fallbackTask == nil)
        context.owner.suspend()
    }

    private func json<T: Encodable>(_ value: T) throws -> [String: Any] {
        try #require(JSONSerialization.jsonObject(with: APICoding.encode(value)) as? [String: Any])
    }
    private func meeting(_ context: FeedTestContext) throws -> [String: Any] {
        var value = try json(#require(context.owner.meeting))
        value["organizer_id"] = try context.user.id.uuidString
        value["my_rsvp"] = "going"
        value["period"] = "upcoming"
        return value
    }
    private func snapshot(_ context: FeedTestContext, epoch: UUID, entries: [FeedEntry]) throws
        -> Data
    {
        try JSONSerialization.data(withJSONObject: [
            "mode": "snapshot", "stream_epoch": epoch.uuidString,
            "change_cursor": "snapshot.cursor",
            "entries": entries.map { try json($0) }, "projections": [], "meeting": meeting(context),
            "projection_version": "1", "latest_sequence": "100",
            "range": ["first_sequence": NSNull(), "last_sequence": NSNull()],
            "has_older": false, "has_newer": false,
        ])
    }
    private func changes(_ context: FeedTestContext, epoch: UUID, entries: [FeedEntry]) throws
        -> Data
    {
        try JSONSerialization.data(
            withJSONObject: changesObject(context, epoch: epoch, entries: entries))
    }
    private func changesObject(_ context: FeedTestContext, epoch: UUID, entries: [FeedEntry]) throws
        -> [String: Any]
    {
        [
            "mode": "changes", "stream_epoch": epoch.uuidString, "next_cursor": "changes.cursor",
            "through_cursor": "through.cursor", "has_more": false, "meeting": try meeting(context),
            "projection_version": "2",
            "changes": try entries.map { entry in
                [
                    "kind": "entry_upsert", "projection_version": "2",
                    "projection": [
                        "resource_kind": "entry", "resource_id": entry.id.uuidString,
                        "projection_version": "2", "entry": try json(entry),
                    ],
                ] as [String: Any]
            },
        ]
    }
}

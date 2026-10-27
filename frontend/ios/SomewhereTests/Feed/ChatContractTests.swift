import Foundation
import Testing

@testable import Somewhere

struct ChatContractTests {
    @Test func syncRoutesAndAroundUsePublishedAPI() throws {
        let origin = try APIOrigin(try #require(URL(string: "https://api.example")))
        let meeting = UUID()
        let entry = UUID()
        #expect(try origin.url(for: ChatRequests.capabilities).path == "/api/v1/chat-capabilities")
        let snapshot = try origin.url(for: ChatRequests.snapshot(meeting, aroundEntryID: entry))
        #expect(snapshot.path == "/api/v1/meetings/" + meeting.uuidString.lowercased() + "/sync")
        let query = try #require(URLComponents(url: snapshot, resolvingAgainstBaseURL: false))
            .queryItems
        #expect(
            query?.contains(
                URLQueryItem(name: "around_entry_id", value: entry.uuidString.lowercased())) == true
        )
        let cursor = "opaque.signature"
        let changes = try origin.url(for: ChatRequests.changes(meeting, cursor: cursor))
        #expect(
            URLComponents(url: changes, resolvingAgainstBaseURL: false)?.queryItems?
                .contains(URLQueryItem(name: "cursor", value: cursor)) == true)
    }

    @Test func snapshotAndChangesDecodeIndependentCursorsAndLargeVersions() throws {
        let meeting = try Fixtures.meeting()
        var meetingJSON = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(meeting)) as? [String: Any])
        meetingJSON.removeValue(forKey: "created_at")
        meetingJSON["period"] = "upcoming"
        let epoch = UUID()
        let snapshotJSON: [String: Any] = [
            "mode": "snapshot", "stream_epoch": epoch.uuidString.lowercased(),
            "change_cursor": "opaque.snapshot", "entries": [], "projections": [],
            "meeting": meetingJSON, "projection_version": "18446744073709551615",
            "latest_sequence": "9007199254740993",
            "range": ["first_sequence": NSNull(), "last_sequence": NSNull()],
            "has_older": false, "has_newer": false,
            "my_read_state": NSNull(), "first_unread": NSNull(),
        ]
        let snapshot = try APICoding.decode(
            ChatSnapshot.self, from: JSONSerialization.data(withJSONObject: snapshotJSON))
        #expect(snapshot.streamEpoch == epoch)
        #expect(snapshot.changeCursor == "opaque.snapshot")
        #expect(snapshot.projectionVersion.rawValue == "18446744073709551615")
        #expect(snapshot.latestSequence.rawValue == "9007199254740993")
        #expect(snapshot.range.firstSequence == nil)
        #expect(try snapshot.meeting.replacing(meeting).createdAt == meeting.createdAt)
        let changesJSON: [String: Any] = [
            "mode": "changes", "stream_epoch": epoch.uuidString.lowercased(),
            "next_cursor": "opaque.next", "through_cursor": "opaque.through", "has_more": true,
            "changes": [["kind": "history_invalidated", "projection_version": "9007199254740993"]],
            "meeting": meetingJSON, "projection_version": "18446744073709551615",
        ]
        let changes = try APICoding.decode(
            ChatChanges.self, from: JSONSerialization.data(withJSONObject: changesJSON))
        #expect(changes.nextCursor != changes.throughCursor)
        #expect(changes.hasMore)
        #expect(changes.changes.first?.projection == nil)
        #expect(changes.changes.first?.kind == "history_invalidated")
    }
}

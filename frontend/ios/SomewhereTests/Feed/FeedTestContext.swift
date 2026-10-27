import Foundation
import Testing

@testable import Somewhere

@MainActor
struct FeedTestContext {
    let harness: SessionHarness
    let id = UUID()
    let owner: FeedOwner
    var path: String { "/api/v1/meetings/" + id.uuidString.lowercased() }
    var user: UserProfile { get throws { try #require(harness.session.profile) } }
    init(storage: any ChatPersistence = MemoryChatStorage()) async throws {
        harness = try SessionHarness(chatStorage: storage)
        try await harness.login()
        let invitation = InvitationOwner(
            target: .meeting(id), api: harness.session.api, session: harness.session)
        invitation.canAccess = true
        owner = FeedOwner(id: id, session: harness.session, invitation: invitation)
        var resource = ResourceState<Meeting>()
        let token = resource.begin()
        resource.succeed(try Fixtures.meeting(id), requestID: token)
        harness.session.privateData.details[id] = resource
    }
    func entry(_ sequence: String, key: UUID? = nil, text: String = "Привет") throws -> FeedEntry {
        try FeedEntry(
            id: UUID(), meetingID: id, sequence: ServerCounter(sequence), kind: "message",
            payloadVersion: 1, actor: user, occurredAt: APIInstant("2026-10-21T12:00:00Z"),
            payload: ["text": .string(text)], clientRequestID: key)
    }
    func page(_ entries: [FeedEntry], more: Bool = false, latest: String = "999") throws -> Data {
        try APICoding.encode(
            FeedPage(
                entries: entries, hasMore: more, meetingRevision: .zero,
                participantCount: 1, myRSVP: .going, myRSVPRevision: .zero,
                latestSequence: ServerCounter(latest)))
    }
    func enqueue(_ entries: [FeedEntry], more: Bool = false, gate: TestGate? = nil) async throws {
        await harness.transport.enqueue(
            path + "/feed", data: try page(entries, more: more), gate: gate)
    }
}

import Foundation
import Testing

@testable import Somewhere

@MainActor
struct InvitationCoverTestContext {
    let harness: SessionHarness
    let id: UUID
    let token = InvitationLinkTests.token
    let privateURL: URL
    let publicURL: URL
    let owner: InvitationOwner

    var details: String { "/api/v1/meetings/" + id.uuidString.lowercased() }
    var publicPath: String { "/api/v1/invitations/" + token }
    var replyPath: String {
        if case .token = owner.target { return publicPath + "/rsvp" }
        return details + "/rsvp"
    }

    init(tokenTarget: Bool = false) async throws {
        harness = try SessionHarness()
        try await harness.login()
        id = UUID()
        let version = String(repeating: "a", count: 64)
        privateURL = try #require(
            URL(
                string: "https://api.example.test/api/v1/meetings/"
                    + id.uuidString.lowercased() + "/cover?v=" + version))
        publicURL = try #require(
            URL(
                string: "https://api.example.test/api/v1/invitations/"
                    + InvitationLinkTests.token + "/cover?v=" + version))
        owner = InvitationOwner(
            target: tokenTarget ? .token(InvitationLinkTests.token) : .meeting(id),
            api: harness.session.api, session: harness.session)
    }

    func preview(_ answer: RSVPAnswer, revision: Int, blocked: Bool = false, id: UUID? = nil)
        throws -> InvitationPreview
    {
        try InvitationPreview(
            meetingID: id ?? self.id, title: "Публичная встреча", description: "Общее описание",
            startsAt: APIInstant("2099-10-24T16:00:00Z"), timezone: "Europe/Moscow", place: "Лофт",
            coverURL: publicURL, myRSVP: answer, myRSVPRevision: ServerCounter(String(revision)),
            joinClosesAt: APIInstant("2099-10-24T15:00:00Z"), canJoin: !blocked,
            joinDisabledReason: blocked ? "join_closed" : nil)
    }

    func meeting(revision: Int) throws -> Meeting {
        try Meeting(
            id: id, title: "Публичная встреча", startsAt: APIInstant("2099-10-24T16:00:00Z"),
            timezone: "Europe/Moscow", place: "Лофт", coverURL: privateURL,
            participantCount: 2, revision: ServerCounter(String(revision)), myRSVP: .going,
            myRSVPRevision: ServerCounter(String(revision)), organizerID: UUID(),
            description: "Общее описание", createdAt: APIInstant("2026-10-20T12:00:00Z"))
    }

    func queuePrivate(revision: Int) async throws {
        await harness.transport.enqueue(
            details, data: try APICoding.encode(meeting(revision: revision)))
        await harness.transport.enqueue(
            details + "/participants", data: try APICoding.encode(Participants(participants: [])))
        await harness.transport.enqueue(
            details + "/feed", data: try APICoding.encode(Fixtures.feed(id)))
    }

    func loadGoing() async throws {
        if case .token = owner.target { try await queuePublic(.going, revision: 1) }
        try await queuePrivate(revision: 1)
        await owner.load()
        #expect(owner.canAccess && owner.preview?.coverURL == privateURL)
    }

    func queuePublic(
        _ answer: RSVPAnswer, revision: Int, blocked: Bool = false, id: UUID? = nil,
        gate: TestGate? = nil
    ) async throws {
        await harness.transport.enqueue(
            publicPath,
            data: try APICoding.encode(
                preview(answer, revision: revision, blocked: blocked, id: id)), gate: gate)
    }

    func queueSaved(status: Int = 200, gate: TestGate? = nil) async throws {
        let value = try JSONSerialization.jsonObject(
            with: APICoding.encode(preview(.maybe, revision: 2)))
        let page: [String: Any] = [
            "invitations": [
                [
                    "invitation_url": "https://api.example.test/i/" + token, "preview": value,
                ]
            ],
            "next_cursor": NSNull(),
        ]
        await harness.transport.enqueue(
            "/api/v1/invitations", data: try JSONSerialization.data(withJSONObject: page),
            status: status, gate: gate)
    }

    func select(_ answer: RSVPAnswer) {
        owner.choose(answer)
        owner.pending = InvitationOwner.Submission(
            input: RSVPRequest(answer: answer, expectedRevision: owner.revision), key: UUID())
    }

    func queueReply(_ answer: RSVPAnswer, revision: Int) async throws {
        await harness.transport.enqueue(
            replyPath,
            data: try APICoding.encode(
                RSVPResult(
                    meetingID: id, rsvp: answer, rsvpRevision: ServerCounter(String(revision)),
                    canAccessFeed: answer == .going,
                    meetingRevision: ServerCounter(String(revision)))))
    }

    func queueList() async throws {
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [], nextCursor: nil)))
    }

    func saveMaybe() async throws {
        select(.maybe)
        try await queueReply(.maybe, revision: 2)
        try await queueSaved()
        try await queuePublic(.maybe, revision: 2)
        try await queueList()
        await owner.submit()
    }

    func expectPrivateRevoked() async {
        #expect(!owner.canAccess && harness.session.privateData.denied.contains(id))
        #expect(harness.session.privateData.details[id] == nil)
        #expect(harness.session.privateData.feeds[id] == nil)
        #expect(harness.session.privateData.participants[id] == nil)
        #expect(await harness.transport.count(details + "/invitation") == 0)
    }
}

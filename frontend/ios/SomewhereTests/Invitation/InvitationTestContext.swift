import Foundation
import Testing

@testable import Somewhere

@MainActor
struct InvitationTestContext {
    let harness: SessionHarness
    let id = UUID()
    let token = InvitationLinkTests.token
    let owner: InvitationOwner
    var path: String { "/api/v1/invitations/" + token }
    var details: String { "/api/v1/meetings/" + id.uuidString.lowercased() }

    init() async throws {
        harness = try SessionHarness()
        try await harness.login()
        owner = InvitationOwner(
            target: .token(InvitationLinkTests.token), api: harness.session.api,
            session: harness.session)
    }
    func preview(_ answer: RSVPAnswer? = nil, revision: ServerCounter = .zero) throws
        -> InvitationPreview
    {
        InvitationPreview(
            meetingID: id, title: "Настолки", description: "Публичное описание",
            startsAt: nil, timezone: "Europe/Moscow", place: "У Саши", coverURL: nil,
            myRSVP: answer, myRSVPRevision: revision)
    }
    func enqueuePublic(_ answer: RSVPAnswer? = nil, revision: ServerCounter = .zero) async throws {
        await harness.transport.enqueue(
            path, data: try APICoding.encode(preview(answer, revision: revision)))
        if answer == .going {
            try await enqueuePrivate(revision: revision)
        } else {
            await harness.transport.enqueue(details, status: 403)
        }
    }
    func enqueuePrivate(revision: ServerCounter) async throws {
        let meeting = try Meeting(
            id: id, title: "Настолки", startsAt: nil, timezone: "Europe/Moscow",
            place: "У Саши", coverURL: nil, participantCount: 2, revision: revision,
            myRSVP: .going, myRSVPRevision: revision, organizerID: UUID(), description: "Описание",
            createdAt: APIInstant("2026-10-20T12:00:00Z"))
        await harness.transport.enqueue(details, data: try APICoding.encode(meeting))
        await harness.transport.enqueue(
            details + "/participants", data: try APICoding.encode(Participants(participants: [])))
        await harness.transport.enqueue(
            details + "/feed", data: try APICoding.encode(Fixtures.feed(id)))
    }
    func enqueueList() async throws {
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [], nextCursor: nil)))
    }
    func response(_ answer: RSVPAnswer, revision: ServerCounter) -> RSVPResult {
        RSVPResult(
            meetingID: id, rsvp: answer, rsvpRevision: revision,
            canAccessFeed: answer == .going, meetingRevision: revision)
    }
    func select(_ answer: RSVPAnswer) {
        owner.choose(answer)
        owner.pending = InvitationOwner.Submission(
            input: RSVPRequest(answer: answer, expectedRevision: owner.revision), key: UUID())
    }
}

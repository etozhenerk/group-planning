import Foundation
import Testing

@testable import Somewhere

@MainActor
struct InvitationOwnerTests {
    @Test func anonymousPreviewNeverReadsPrivateDataOrSavesReply() async throws {
        let harness = try SessionHarness()
        let owner = InvitationOwner(
            target: .token(InvitationLinkTests.token), api: harness.session.api, session: nil)
        let value = InvitationPreview(
            meetingID: UUID(), title: "Приглашение", description: "Публично",
            startsAt: nil, timezone: "UTC", place: nil, coverURL: nil, myRSVP: nil,
            myRSVPRevision: .zero)
        await harness.transport.enqueue(
            "/api/v1/invitations/" + InvitationLinkTests.token, data: try APICoding.encode(value))
        await owner.load()
        owner.choose(.going)
        await owner.submit()
        #expect(owner.preview == value && !owner.canAccess && owner.answer == nil)
        #expect(await harness.transport.requests.count == 1)
        #expect(
            await harness.transport.requests.first?.value(forHTTPHeaderField: "Authorization")
                == nil)
    }
    @Test func uncertainReplyRetriesSameBodyAndKeyWithoutGrantingAccess() async throws {
        let context = try await InvitationTestContext()
        try await context.enqueuePublic()
        await context.owner.load()
        context.select(.going)
        await context.harness.transport.enqueue(context.path + "/rsvp", status: 503)
        await context.owner.submit()
        #expect(
            context.owner.answer == nil && !context.owner.canAccess && context.owner.pending != nil)
        let one = try ServerCounter("1")
        await context.harness.transport.enqueue(
            context.path + "/rsvp",
            data: try APICoding.encode(context.response(.going, revision: one)))
        try await context.enqueuePrivate(revision: one)
        try await context.enqueueList()
        await context.owner.submit()
        #expect(
            context.owner.answer == .going && context.owner.canAccess
                && context.owner.pending == nil)
        let requests = await context.harness.transport.requests.filter { $0.httpMethod == "PUT" }
        #expect(requests.count == 2 && requests.first?.httpBody == requests.last?.httpBody)
        #expect(
            requests.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == requests.last?.value(forHTTPHeaderField: "Idempotency-Key"))
    }
    @Test func withdrawalPurgesFeedAndRejectsLateRead() async throws {
        let context = try await InvitationTestContext()
        let one = try ServerCounter("1")
        try await context.enqueuePublic(.going, revision: one)
        await context.owner.load()
        #expect(context.owner.canAccess)
        let gate = TestGate()
        await context.harness.transport.enqueue(
            context.details + "/feed", data: try APICoding.encode(Fixtures.feed(context.id)),
            gate: gate)
        let pending = Task {
            await MeetingRepository(session: context.harness.session).loadFeed(context.id)
        }
        try await context.harness.transport.waitFor(context.details + "/feed", count: 2)
        context.select(.maybe)
        await context.harness.transport.enqueue(
            context.path + "/rsvp",
            data: try APICoding.encode(context.response(.maybe, revision: ServerCounter("2"))))
        try await context.enqueueList()
        await context.owner.submit()
        await gate.release()
        await pending.value
        #expect(context.owner.answer == .maybe && !context.owner.canAccess)
        #expect(context.harness.session.privateData.feeds[context.id] == nil)
        #expect(context.harness.session.privateData.participants[context.id] == nil)
        #expect(context.harness.session.privateData.denied.contains(context.id))
    }
    @Test func conflictReloadsCurrentAnswerWithoutAutomaticOverwrite() async throws {
        let context = try await InvitationTestContext()
        try await context.enqueuePublic()
        await context.owner.load()
        context.select(.going)
        await context.harness.transport.enqueue(context.path + "/rsvp", status: 409)
        try await context.enqueuePublic(.notGoing, revision: ServerCounter("3"))
        await context.owner.submit()
        let currentRevision = try ServerCounter("3")
        #expect(context.owner.answer == .notGoing && context.owner.revision == currentRevision)
        #expect(context.owner.pending == nil && !context.owner.canAccess)
        #expect(await context.harness.transport.count(context.path + "/rsvp") == 1)
    }
    @Test func changedSessionRejectsLateResponseAndAccess() async throws {
        let context = try await InvitationTestContext()
        try await context.enqueuePublic()
        await context.owner.load()
        context.select(.going)
        let gate = TestGate()
        await context.harness.transport.enqueue(
            context.path + "/rsvp",
            data: try APICoding.encode(context.response(.going, revision: ServerCounter("1"))),
            gate: gate)
        let operation = Task { await context.owner.submit() }
        try await context.harness.transport.waitFor(context.path + "/rsvp")
        try await context.harness.login(name: "Другой профиль")
        await gate.release()
        await operation.value
        #expect(!context.owner.current && !context.owner.canAccess)
        #expect(context.harness.session.privateData.feeds.isEmpty)
    }
    @Test func expiredSessionClosesAccess() async throws {
        let context = try await InvitationTestContext()
        try await context.enqueuePublic(.going, revision: ServerCounter("1"))
        await context.owner.load()
        #expect(context.owner.canAccess)
        context.select(.notGoing)
        await context.harness.transport.enqueue(context.path + "/rsvp", status: 401)
        await context.owner.submit()
        #expect(context.harness.session.status == .signedOut && !context.owner.canAccess)
        #expect(context.harness.session.privateData.feeds.isEmpty)
    }
    @Test func unavailableInvitationDoesNotExposeCachedDetails() async throws {
        let context = try await InvitationTestContext()
        try await context.enqueuePublic(.going, revision: ServerCounter("1"))
        await context.owner.load()
        #expect(context.owner.canAccess && context.owner.preview != nil)
        await context.harness.transport.enqueue(context.path, status: 404)
        await context.owner.load()
        #expect(
            context.owner.unavailable && context.owner.preview == nil && !context.owner.canAccess)
    }

}

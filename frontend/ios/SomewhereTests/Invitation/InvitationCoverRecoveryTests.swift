import Foundation
import Testing

@testable import Somewhere

@MainActor
struct InvitationCoverRecoveryTests {
    @Test func privatePreviewFromRealtimeReloadIsReplacedAndLateReloadCannotRestoreIt()
        async throws
    {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        let feed = FeedOwner(id: c.id, session: c.harness.session, invitation: c.owner)
        await c.harness.transport.enqueue(
            c.details, data: try APICoding.encode(c.meeting(revision: 1)))
        await feed.reloadDetails(version: feed.generation)
        #expect(c.owner.preview?.coverURL == c.privateURL)
        let gate = TestGate()
        await c.harness.transport.enqueue(
            c.details, data: try APICoding.encode(c.meeting(revision: 1)), gate: gate)
        let late = Task { await feed.reloadDetails(version: feed.generation) }
        try await c.harness.transport.waitFor(c.details, count: 3)
        try await c.saveMaybe()
        #expect(c.owner.preview?.coverURL == c.publicURL && c.owner.answer == .maybe)
        await gate.release()
        await late.value
        #expect(c.owner.preview?.coverURL == c.publicURL && c.owner.answer == .maybe)
        #expect(!feed.current && !c.owner.canAccess)
        await c.expectPrivateRevoked()
    }

    @Test func meetingTargetMaybeUsesOwnSavedPublicCoverWithoutReopeningPrivateAccess() async throws
    {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        let image = CoverImageOwner(api: c.harness.session.api, session: c.harness.session)
        await c.harness.transport.enqueue(
            c.privateURL.path, data: try CoverFixtures.jpeg(), mime: "image/jpeg")
        await image.load(.remote(c.privateURL, c.id))
        #expect(image.image != nil)
        try await c.saveMaybe()
        #expect(c.owner.answer == .maybe && c.owner.preview?.coverURL == c.publicURL)
        #expect(c.owner.preview?.myRSVP == .maybe && c.owner.problem == nil)
        #expect(c.owner.responseProblem == nil && image.image == nil)
        await c.expectPrivateRevoked()
        await c.harness.transport.enqueue(
            c.publicURL.path, data: try CoverFixtures.jpeg(), mime: "image/jpeg")
        await image.load(.remote(c.publicURL, c.id))
        #expect(image.image != nil)
        #expect(
            await c.harness.transport.requests.last?.value(forHTTPHeaderField: "Authorization")
                == nil)
        try await c.queuePublic(.maybe, revision: 2)
        await c.owner.load()
        #expect(c.owner.problem == nil && c.owner.preview?.coverURL == c.publicURL)
        #expect(await c.harness.transport.count(c.details) == 1)
        #expect(await c.harness.transport.count("/api/v1/invitations") == 1)
        await c.expectPrivateRevoked()
    }

    @Test func rememberedPublicTokenSurvivesMaybeToNotGoingAndFreshGoingRestoresPrivateState()
        async throws
    {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        try await c.saveMaybe()
        c.select(.notGoing)
        try await c.queueReply(.notGoing, revision: 3)
        try await c.queuePublic(.notGoing, revision: 3)
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.answer == .notGoing && c.owner.preview?.coverURL == c.publicURL)
        #expect(await c.harness.transport.count("/api/v1/invitations") == 1)
        await c.expectPrivateRevoked()
        c.select(.going)
        try await c.queueReply(.going, revision: 4)
        try await c.queuePrivate(revision: 4)
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.canAccess && !c.harness.session.privateData.denied.contains(c.id))
        #expect(await c.harness.transport.count(c.details) == 2)
    }

    @Test func idOnlyNotGoingDoesNotInventTokenOrKeepPrivateCover() async throws {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        c.select(.notGoing)
        try await c.queueReply(.notGoing, revision: 2)
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.answer == .notGoing && c.owner.preview?.myRSVP == .notGoing)
        #expect(c.owner.preview?.coverURL == nil && c.owner.problem == nil)
        #expect(await c.harness.transport.count(c.details) == 1)
        #expect(await c.harness.transport.count("/api/v1/invitations") == 0)
        await c.expectPrivateRevoked()
    }

    @Test func tokenTargetNotGoingRetainsPublicCoverAndServerCutoff() async throws {
        let c = try await InvitationCoverTestContext(tokenTarget: true)
        try await c.loadGoing()
        c.select(.notGoing)
        try await c.queueReply(.notGoing, revision: 2)
        try await c.queuePublic(.notGoing, revision: 2, blocked: true)
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.preview?.coverURL == c.publicURL && c.owner.joinClosed)
        c.owner.choose(.going)
        #expect(c.owner.choice == .notGoing && !c.owner.canSave)
        #expect(await c.harness.transport.count("/api/v1/invitations") == 0)
        await c.expectPrivateRevoked()
    }

    @Test func publicRecoveryFailureKeepsConfirmedMaybeAndPrivateCacheRevoked() async throws {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        c.select(.maybe)
        try await c.queueReply(.maybe, revision: 2)
        try await c.queueSaved(status: 503)
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.answer == .maybe && c.owner.pending == nil)
        #expect(c.owner.preview?.myRSVP == .maybe && c.owner.preview?.coverURL == nil)
        #expect(c.owner.responseProblem != nil)
        await c.expectPrivateRevoked()
        try await c.queueSaved()
        try await c.queuePublic(.maybe, revision: 2, blocked: true)
        await c.owner.load()
        #expect(c.owner.preview?.coverURL == c.publicURL && c.owner.joinClosed)
        #expect(c.owner.problem == nil && c.owner.responseProblem == nil)
        c.owner.choose(.going)
        #expect(c.owner.choice == .maybe && !c.owner.canSave)
        await c.expectPrivateRevoked()
    }

    @Test func mismatchedPublicMeetingCannotReplaceWithdrawalPreviewOrGrantAccess() async throws {
        let c = try await InvitationCoverTestContext()
        try await c.loadGoing()
        c.select(.maybe)
        try await c.queueReply(.maybe, revision: 2)
        try await c.queueSaved()
        try await c.queuePublic(.maybe, revision: 2, id: UUID())
        try await c.queueList()
        await c.owner.submit()
        #expect(c.owner.preview?.meetingID == c.id && c.owner.preview?.coverURL == nil)
        #expect(c.owner.publicToken == nil && c.owner.responseProblem != nil)
        await c.expectPrivateRevoked()
    }

    @Test func lateSavedLookupCannotApplyAfterCancellationOrLogout() async throws {
        for logout in [false, true] {
            let c = try await InvitationCoverTestContext()
            try await c.loadGoing()
            c.select(.maybe)
            try await c.queueReply(.maybe, revision: 2)
            let gate = TestGate()
            try await c.queueSaved(gate: gate)
            let pending = Task { await c.owner.submit() }
            try await c.harness.transport.waitFor("/api/v1/invitations")
            if logout {
                await c.harness.transport.enqueue("/api/v1/auth/logout", status: 204)
                try await c.harness.session.logout()
            } else {
                c.owner.suspend()
                pending.cancel()
            }
            await gate.release()
            await pending.value
            #expect(!c.owner.canAccess && c.owner.publicToken == nil)
            #expect(c.owner.preview?.coverURL == nil)
            #expect(c.harness.session.privateData.feeds[c.id] == nil)
            #expect(await c.harness.transport.count(c.details + "/invitation") == 0)
        }
    }
}

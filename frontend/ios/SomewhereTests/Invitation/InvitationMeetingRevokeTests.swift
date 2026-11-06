import Foundation
import Testing

@testable import Somewhere

@MainActor
struct InvitationMeetingRevokeTests {
    @Test func meetingDenialRefreshesKnownPublicResponseWithoutCreatingLocalOutcome() async throws {
        let context = try await InvitationTestContext()
        let oldRevision = try ServerCounter("2")
        let currentRevision = try ServerCounter("3")
        let owner = InvitationOwner(
            target: .meeting(context.id, publicToken: context.token),
            api: context.harness.session.api, session: context.harness.session)
        owner.preview = try context.preview(.going, revision: oldRevision)
        owner.answer = .going
        owner.choice = .going
        owner.revision = oldRevision
        context.harness.session.updateMeetingAccess(context.id, allowed: false)
        await context.harness.transport.enqueue(context.details, status: 403)
        await context.harness.transport.enqueue(
            context.path,
            data: try APICoding.encode(context.preview(.notGoing, revision: currentRevision)))

        await owner.load()

        #expect(owner.answer == .notGoing && owner.choice == .notGoing)
        #expect(owner.revision == currentRevision && owner.preview?.myRSVP == .notGoing)
        #expect(!owner.canAccess && !owner.organizer)
        #expect(owner.completedResponse == nil && owner.completedResponseID == nil)
        #expect(context.harness.session.privateData.denied.contains(context.id))
        #expect(context.harness.session.privateData.details[context.id] == nil)
        let requests = await context.harness.transport.requests
        let privateReads = requests.filter { $0.url?.path == context.details }
        let publicReads = requests.filter { $0.url?.path == context.path }
        #expect(privateReads.count == 1 && publicReads.count == 1)
    }

    @Test func meetingDenialWithoutPublicSourceDoesNotKeepGoingSelected() async throws {
        let context = try await InvitationTestContext()
        let oldRevision = try ServerCounter("2")
        let owner = InvitationOwner(
            target: .meeting(context.id), api: context.harness.session.api,
            session: context.harness.session)
        owner.preview = try context.preview(.going, revision: oldRevision)
        owner.answer = .going
        owner.choice = .going
        owner.revision = oldRevision
        await context.harness.transport.enqueue(context.details, status: 403)

        await owner.load()

        #expect(owner.answer == nil && owner.choice == nil && owner.preview == nil)
        #expect(!owner.canAccess && owner.problem != nil)
        #expect(owner.completedResponse == nil)
        #expect(context.harness.session.privateData.denied.contains(context.id))
        let requests = await context.harness.transport.requests
        let publicReads = requests.filter { $0.url?.path == context.path }
        #expect(publicReads.isEmpty)
    }
}

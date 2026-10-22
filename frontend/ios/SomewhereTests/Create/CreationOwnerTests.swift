import Foundation
import Testing

@testable import Somewhere

@MainActor
struct CreationOwnerTests {
    private func owner(
        _ harness: SessionHarness, storage: MemoryDraftStorage = MemoryDraftStorage()
    ) async throws -> CreationOwner {
        try await harness.login()
        let user = try #require(harness.session.profile)
        let owner = CreationOwner(
            userID: user.id, session: harness.session, drafts: DraftRepository(storage: storage),
            timezone: "Europe/Moscow")
        await owner.load()
        owner.change { $0 = MeetingDraftTests.filled() }
        return owner
    }
    private func result() throws -> CreatedMeeting {
        CreatedMeeting(
            meeting: try Fixtures.meeting(title: "Настолки"), role: "organizer",
            invitationURL: try #require(URL(string: "https://api.example.test/i/example")))
    }
    @Test func calendarPrefillPreservesDraftAndDoesNotModifyPendingSubmission() async throws {
        let h = try SessionHarness()
        try await h.login()
        let user = try #require(h.session.profile)
        let storage = MemoryDraftStorage()
        let draft = MeetingDraftTests.filled()
        let saved = DraftRecord(ownerID: user.id, value: draft)
        try storage.save(saved)
        let day = MeetingDraft.Day(year: 2028, month: 2, day: 29)
        let owner = CreationOwner(
            userID: user.id, session: h.session, drafts: DraftRepository(storage: storage),
            initialDay: day)
        await owner.load()
        #expect(
            owner.value.day == day && owner.value.clock == draft.clock
                && owner.value.title == draft.title)
        #expect(owner.value.timezone == draft.timezone)
        var pending = saved
        pending.submission = try draft.input()
        try storage.save(pending)
        let retry = CreationOwner(
            userID: user.id, session: h.session, drafts: DraftRepository(storage: storage),
            initialDay: day)
        await retry.load()
        #expect(retry.record == pending)
    }

    @Test func lostResponseRestoresFrozenBodyAndKey() async throws {
        let harness = try SessionHarness()
        let storage = MemoryDraftStorage()
        let owner = try await owner(harness, storage: storage)
        await harness.transport.enqueue("/api/v1/meetings", status: 503)
        await owner.submit()
        #expect(owner.frozen && owner.created == nil)
        owner.change { $0.title = "Нельзя менять" }
        let user = try #require(harness.session.profile)
        let restored = CreationOwner(
            userID: user.id, session: harness.session, drafts: DraftRepository(storage: storage))
        await restored.load()
        #expect(restored.record == owner.record && restored.frozen)
        let expected = try result()
        await harness.transport.enqueue(
            "/api/v1/meetings", data: try APICoding.encode(expected), status: 201)
        await restored.submit()
        #expect(restored.created == expected)
        let requests = await harness.transport.requests.filter {
            $0.url?.path == "/api/v1/meetings"
        }
        #expect(requests.count == 2)
        #expect(requests.first?.httpBody == requests.last?.httpBody)
        #expect(
            requests.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == requests.last?.value(forHTTPHeaderField: "Idempotency-Key"))
        #expect(try storage.load(owner: user.id) == nil)
        owner.cancel()
    }
    @Test func diskFailurePreventsRequestAndValidationUnlocksFields() async throws {
        let harness = try SessionHarness()
        let owner = try await owner(harness, storage: MemoryDraftStorage(fails: true))
        await owner.submit()
        #expect(await harness.transport.count("/api/v1/meetings") == 0)
        #expect(owner.created == nil && owner.problem != nil)
        owner.cancel()
        let editable = try await self.owner(try SessionHarness())
        editable.change { $0.title = "" }
        await editable.submit()
        #expect(!editable.frozen && editable.editable)
        editable.cancel()
    }
    @Test func doubleSubmitAndLateResponseAfterLogoutCannotPublish() async throws {
        let harness = try SessionHarness()
        let owner = try await owner(harness)
        let gate = TestGate()
        await harness.transport.enqueue(
            "/api/v1/meetings", data: try APICoding.encode(result()), status: 201, gate: gate)
        let pending = Task { await owner.submit() }
        try await harness.transport.waitFor("/api/v1/meetings")
        await owner.submit()
        #expect(await harness.transport.count("/api/v1/meetings") == 1)
        try? await harness.session.logout()
        await gate.release()
        await pending.value
        #expect(owner.created == nil && harness.session.privateData.details.isEmpty)
        owner.cancel()
    }
    @Test func changeCanReadCurrentDraftWithoutOverlappingAccess() async throws {
        let harness = try SessionHarness()
        let owner = try await owner(harness)
        owner.change { draft in
            draft.day = LocalMeetingTime.day(
                Date(), zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
        }
        #expect(owner.value.day != nil)
        owner.cancel()
    }
    @Test func unauthorizedClearsSessionAndCannotPublish() async throws {
        let harness = try SessionHarness()
        let owner = try await owner(harness)
        await harness.transport.enqueue("/api/v1/meetings", status: 401)
        await owner.submit()
        #expect(harness.session.status == .signedOut && owner.created == nil)
        owner.cancel()
    }
}

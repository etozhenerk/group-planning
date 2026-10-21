import Foundation
import Testing

@testable import Somewhere

@MainActor
struct MeetingSettingsTests {
    func meeting(id: UUID = UUID(), revision: String = "1", title: String = "Настолки") throws
        -> Meeting
    {
        try Meeting(
            id: id, title: title, startsAt: APIInstant("2026-11-01T01:30:00-05:00"),
            timezone: "America/New_York", place: "Кафе", coverURL: nil, participantCount: 2,
            revision: ServerCounter(revision), myRSVP: nil, myRSVPRevision: .zero,
            organizerID: UUID(), description: "Игры и пицца",
            createdAt: APIInstant("2026-10-21T12:00:00Z"))
    }
    @Test func textOnlyEditDoesNotReinterpretAmbiguousTimeAndClearIsNull() throws {
        let baseline = try meeting()
        var draft = MeetingSettingsDraft.make(baseline)
        draft.description = ""
        draft.place = ""
        let body = try APICoding.encode(MeetingSettingsDraft.patch(draft, from: baseline))
        let object = try #require(JSONSerialization.jsonObject(with: body) as? [String: Any])
        #expect(object["starts_at"] == nil && object["timezone"] == nil && object["title"] == nil)
        #expect(object["description"] is NSNull && object["place"] is NSNull)
        #expect(object["expected_revision"] as? String == "1")
    }
    @Test func conflictRetainsFormAndRequiresExplicitReloadBeforeAnotherMutation() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let baseline = try meeting()
        let owner = MeetingSettingsOwner(meeting: baseline, session: harness.session)
        let path = "/api/v1/meetings/" + baseline.id.uuidString.lowercased()
        owner.change { $0.title = "Мой вариант" }
        await harness.transport.enqueue(path, status: 409)
        await owner.submit()
        #expect(owner.conflict && owner.value.title == "Мой вариант" && owner.pending == nil)
        await owner.submit()
        #expect(await harness.transport.count(path) == 1)
        let updated = try meeting(id: baseline.id, revision: "2", title: "С другого устройства")
        await harness.transport.enqueue(path, data: try APICoding.encode(updated))
        await owner.reload()
        #expect(!owner.conflict && owner.value.title == updated.title && !owner.dirty)
    }
    @Test func uncertainSaveFreezesRequestAndRetryKeepsKeyAndBody() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let baseline = try meeting()
        let owner = MeetingSettingsOwner(meeting: baseline, session: harness.session)
        let path = "/api/v1/meetings/" + baseline.id.uuidString.lowercased()
        owner.change { $0.title = "Суббота" }
        await harness.transport.enqueue(path, status: 503)
        await owner.submit()
        #expect(owner.pending != nil && !owner.editable)
        owner.change { $0.title = "Незаметная замена" }
        #expect(owner.value.title == "Суббота")
        await harness.transport.enqueue(
            path,
            data: try APICoding.encode(meeting(id: baseline.id, revision: "2", title: "Суббота")))
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [], nextCursor: nil)))
        await owner.submit()
        let requests = await harness.transport.requests.filter { $0.httpMethod == "PATCH" }
        #expect(owner.saved?.title == "Суббота" && owner.pending == nil)
        #expect(requests.count == 2 && requests.first?.httpBody == requests.last?.httpBody)
        #expect(
            requests.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == requests.last?.value(forHTTPHeaderField: "Idempotency-Key"))
    }
    @Test func organizerPermissionFailureDoesNotRevokeFeed() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let baseline = try meeting()
        try harness.seed(baseline.id)
        let owner = MeetingSettingsOwner(meeting: baseline, session: harness.session)
        owner.change { $0.title = "Правка" }
        await harness.transport.enqueue(
            "/api/v1/meetings/" + baseline.id.uuidString.lowercased(), status: 403)
        await owner.submit()
        #expect(owner.forbidden && owner.current)
        #expect(!harness.session.privateData.denied.contains(baseline.id))
        #expect(harness.session.privateData.feeds[baseline.id]?.value != nil)
    }
    @Test func lateSettingsResponseCannotRestoreRevokedMeeting() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let baseline = try meeting()
        let owner = MeetingSettingsOwner(meeting: baseline, session: harness.session)
        owner.change { $0.title = "Правка" }
        let path = "/api/v1/meetings/" + baseline.id.uuidString.lowercased()
        let gate = TestGate()
        await harness.transport.enqueue(path, data: try APICoding.encode(baseline), gate: gate)
        let pending = Task { await owner.submit() }
        try await harness.transport.waitFor(path)
        harness.session.updateMeetingAccess(baseline.id, allowed: false)
        await gate.release()
        await pending.value
        #expect(
            !owner.current && owner.saved == nil
                && harness.session.privateData.details[baseline.id] == nil)
    }
}

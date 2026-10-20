import Foundation
import Testing

@testable import Somewhere

@MainActor
struct MeetingRepositoryTests {
    @Test func retryPreservesPreviousSnapshotAndClearsError() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        try harness.seed(id)
        let path = "/api/v1/meetings/\(id.uuidString.lowercased())"
        let repository = MeetingRepository(session: harness.session)
        await harness.transport.enqueue(path, status: 503)
        await repository.loadMeeting(id)
        #expect(repository.state.details[id]?.value != nil)
        #expect(repository.state.details[id]?.error == .http(503, nil))
        await harness.transport.enqueue(
            path, data: try APICoding.encode(Fixtures.meeting(id, title: "Обновлено")))
        await repository.loadMeeting(id)
        #expect(repository.state.details[id]?.value?.title == "Обновлено")
        #expect(repository.state.details[id]?.error == nil)
        #expect(repository.state.details[id]?.isLoading == false)
    }

    @Test func overlappingLoadsCannotReplaceNewerSnapshot() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        let path = "/api/v1/meetings/\(id.uuidString.lowercased())"
        let gate = TestGate()
        let repository = MeetingRepository(session: harness.session)
        await harness.transport.enqueue(
            path, data: try APICoding.encode(Fixtures.meeting(id, title: "Старое")), gate: gate)
        let old = Task { await repository.loadMeeting(id) }
        try await harness.transport.waitFor(path)
        await harness.transport.enqueue(
            path, data: try APICoding.encode(Fixtures.meeting(id, title: "Новое")))
        await repository.loadMeeting(id)
        await gate.release()
        await old.value
        #expect(repository.state.details[id]?.value?.title == "Новое")
    }

    @Test func cancellationEndsLoadingWithoutError() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        let path = "/api/v1/meetings/\(id.uuidString.lowercased())"
        let gate = TestGate()
        let repository = MeetingRepository(session: harness.session)
        await harness.transport.enqueue(
            path, data: try APICoding.encode(Fixtures.meeting(id)), gate: gate)
        let load = Task { await repository.loadMeeting(id) }
        try await harness.transport.waitFor(path)
        load.cancel()
        await gate.release()
        await load.value
        #expect(repository.state.details[id]?.isLoading == false)
        #expect(repository.state.details[id]?.error == nil)
        #expect(repository.state.details[id]?.value == nil)
    }
}

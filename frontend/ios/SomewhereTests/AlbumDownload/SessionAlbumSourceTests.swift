import Foundation
import Testing

@testable import Somewhere

@MainActor @Suite(.serialized)
struct SessionAlbumSourceTests {
    @Test func fullSnapshotAndContentUseConfiguredOriginAndFixedLease() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let media = try AlbumSourceFake(count: 103)
        let meetingID = media.meetingID
        let json = try APICoding.encode(media.media)
        var snapshot = Data("{\"photos\":".utf8)
        snapshot.append(json)
        snapshot.append(Data(",\"next_cursor\":null}".utf8))
        let path = "/api/v1/meetings/" + meetingID.uuidString.lowercased()
        await harness.transport.enqueue(path + "/memories/snapshot", data: snapshot)
        let transport = AlbumFileTransportFake()
        let source = try SessionAlbumSource(
            meetingID: meetingID, session: harness.session, transport: transport)
        let result = try await source.snapshot()
        #expect(result.photos.count == 103)
        let photo = try #require(AlbumPhoto.validate(result, meetingID: meetingID).first)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try await source.download(photo, to: file)
        try FileManager.default.removeItem(at: file)
        let wire = try #require(await transport.requests.first)
        #expect(wire.url?.host == "api.example.test")
        #expect(wire.url?.scheme == "https")
        #expect(wire.url?.path == path + "/media/" + photo.id.uuidString.lowercased() + "/content")
        #expect(wire.value(forHTTPHeaderField: "Authorization") == "Bearer test-session")
        #expect(wire.httpShouldHandleCookies == false)
        harness.session.updateMeetingAccess(meetingID, allowed: false)
        harness.session.updateMeetingAccess(meetingID, allowed: true)
        #expect(throws: ClientFailure.accessRevoked) { try source.checkAccess() }
    }

    @Test func forbiddenContentRevokesScope() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let media = try AlbumSourceFake(count: 1)
        let source = try SessionAlbumSource(
            meetingID: media.meetingID, session: harness.session,
            transport: AlbumFileTransportFake(failure: .http(403, nil)))
        let photo = try #require(
            AlbumPhoto.validate(MemorySnapshot(photos: media.media), meetingID: media.meetingID)
                .first)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        await #expect(throws: ClientFailure.http(403, nil)) {
            try await source.download(photo, to: file)
        }
        #expect(harness.session.privateData.denied.contains(media.meetingID))
        #expect(throws: ClientFailure.accessRevoked) { try source.checkAccess() }
    }

    @Test func unauthorizedContentInvalidatesSessionAndScope() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let media = try AlbumSourceFake(count: 1)
        try harness.seed(media.meetingID)
        let source = try SessionAlbumSource(
            meetingID: media.meetingID, session: harness.session,
            transport: AlbumFileTransportFake(failure: .http(401, nil)))
        let photo = try #require(
            AlbumPhoto.validate(MemorySnapshot(photos: media.media), meetingID: media.meetingID)
                .first)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        await #expect(throws: ClientFailure.http(401, nil)) {
            try await source.download(photo, to: file)
        }
        #expect(harness.session.status == .signedOut)
        #expect(harness.session.privateData.details.isEmpty)
        #expect(try harness.storage.load() == nil)
        #expect(throws: ClientFailure.staleSession) { try source.checkAccess() }
        #expect(!FileManager.default.fileExists(atPath: file.path))
    }

    @Test func logoutCancelsDownloadAndRejectsLateResponse() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let media = try AlbumSourceFake(count: 1)
        let gate = TestGate()
        let transport = AlbumFileTransportFake(gate: gate)
        let source = try SessionAlbumSource(
            meetingID: media.meetingID, session: harness.session, transport: transport)
        let photo = try #require(
            AlbumPhoto.validate(MemorySnapshot(photos: media.media), meetingID: media.meetingID)
                .first)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let worker = Task { try await source.download(photo, to: file) }
        for _ in 0..<200 {
            if await transport.requests.count == 1 { break }
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(await transport.requests.count == 1)
        await harness.transport.enqueue("/api/v1/auth/logout", status: 204)
        do { try await harness.session.logout() } catch {
            // Session is invalidated before the best-effort logout endpoint finishes.
            #expect(harness.session.status == .signedOut)
        }
        await gate.release()
        await #expect(throws: ClientFailure.staleSession) { try await worker.value }
        #expect(await transport.wasCancelled)
        #expect(throws: ClientFailure.staleSession) { try source.checkAccess() }
        try FileManager.default.removeItem(at: file)
    }
}

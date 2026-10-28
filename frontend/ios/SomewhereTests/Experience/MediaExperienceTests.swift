import Foundation
import Testing

@testable import Somewhere

@Suite("Private media upload and access")
@MainActor
struct MediaExperienceTests {
    @Test func documentCaptionLimitKeepsWholeEmojiAndSkipsPhotos() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let owner = MediaTransferOwner(id: UUID(), session: harness.session, purpose: "message")
        let document = PendingMedia(
            id: UUID(), publishKey: UUID(), name: "rules.txt", contentType: "text/plain",
            data: Data("rules".utf8))
        let photo = PendingMedia(
            id: UUID(), publishKey: UUID(), name: "photo.jpg", contentType: "image/jpeg",
            data: Data([1]))
        owner.pending = [document, photo]
        let prefix = String(repeating: "а", count: 1998)
        owner.setCaption(prefix + "👨‍👩‍👧‍👦", for: document.id)
        #expect(owner.pending[0].caption == prefix)
        owner.setCaption("Для фото подпись недоступна", for: photo.id)
        #expect(owner.pending[1].caption.isEmpty)
    }
    private func media(_ id: UUID, meeting: UUID, status: String = "published") throws
        -> MeetingMedia
    {
        MeetingMedia(
            id: id, meetingID: meeting, fileName: "заметка.txt", contentType: "text/plain",
            sizeBytes: 4, kind: "file", purpose: "message", status: status,
            downloadURL: "https://external.invalid/private?secret=1", thumbnailURL: nil,
            createdAt: try APIInstant("2026-10-25T12:00:00Z"),
            uploadedBy: UserProfile(id: UUID(), displayName: "Лена"))
    }
    private func envelope(_ value: MeetingMedia) throws -> Data {
        struct Envelope: Encodable { let media: MeetingMedia }
        return try APICoding.encode(Envelope(media: value))
    }
    @Test func downloadReconstructsOwnOriginAndSuppressesRevokedCallback() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let meetingID = UUID()
        let item = try media(UUID(), meeting: meetingID)
        let gate = TestGate()
        let request = ExperienceRequests.content(item)
        let path = try harness.session.api.origin.url(for: request).path
        await harness.transport.enqueue(
            path, data: Data("test".utf8), mime: "text/plain", gate: gate)
        let owner = MediaContentOwner(media: item, session: harness.session)
        let work = Task { await owner.load() }
        try await harness.transport.waitFor(path)
        let wire = try #require(await harness.transport.requests.last)
        #expect(wire.url?.host == "api.example.test")
        #expect(wire.url?.query == nil)
        #expect(wire.value(forHTTPHeaderField: "Authorization") == "Bearer test-session")
        harness.session.updateMeetingAccess(meetingID, allowed: false)
        await gate.release()
        await work.value
        #expect(owner.data == nil)
        #expect(!owner.current)
    }
    @Test func repeatedContentUsesSessionCacheAndRevocationClearsIt() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let meetingID = UUID()
        let item = try media(UUID(), meeting: meetingID)
        let path = try harness.session.api.origin.url(for: ExperienceRequests.content(item)).path
        await harness.transport.enqueue(path, data: Data("test".utf8), mime: "text/plain")
        let first = MediaContentOwner(media: item, session: harness.session)
        await first.load()
        first.clear()
        let second = MediaContentOwner(media: item, session: harness.session)
        #expect(second.data == Data("test".utf8))
        await second.load()
        #expect(await harness.transport.count(path) == 1)
        harness.session.updateMeetingAccess(meetingID, allowed: false)
        #expect(harness.session.privateData.mediaCache.value(item.id) == nil)
        let denied = MediaContentOwner(media: item, session: harness.session)
        #expect(denied.data == nil && !denied.current)
    }

    private func waitForBatch(_ owner: MediaTransferOwner) async throws {
        for _ in 0..<200 {
            if !owner.busy { return }
            try await Task.sleep(for: .milliseconds(10))
        }
        throw ClientFailure.invalidRequest
    }

    @Test func partialUploadPreservesSuccessAndRetriesSamePreparedFile() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let meetingID = UUID()
        let owner = MediaTransferOwner(id: meetingID, session: harness.session, purpose: "message")
        owner.limits = MediaLimits(
            maxPhotoBytes: 10_000_000, maxFileBytes: 20_000_000, maxFiles: 10,
            photoTypes: ["image/jpeg"], fileTypes: ["text/plain"])
        let first = PendingMedia(
            id: UUID(), publishKey: UUID(), name: "1.txt", contentType: "text/plain",
            data: Data("test".utf8))
        let second = PendingMedia(
            id: UUID(), publishKey: UUID(), name: "2.txt", contentType: "text/plain",
            data: Data("test".utf8))
        await owner.add([first, second])
        owner.setCaption("Правила перед встречей", for: second.id)
        let a = try media(UUID(), meeting: meetingID)
        let b = try media(UUID(), meeting: meetingID)
        let base = "/api/v1/meetings/" + meetingID.uuidString.lowercased()
        for value in [a, b] {
            await harness.transport.enqueue(
                base + "/media/uploads", data: try envelope(value), status: 201)
            await harness.transport.enqueue(
                base + "/media/" + value.id.uuidString.lowercased() + "/content",
                data: try envelope(value))
        }
        await harness.transport.enqueue(
            base + "/media/" + a.id.uuidString.lowercased() + "/publish", data: try envelope(a))
        let publishB = base + "/media/" + b.id.uuidString.lowercased() + "/publish"
        let secondPublishGate = TestGate()
        await harness.transport.enqueue(publishB, status: 503, gate: secondPublishGate)
        owner.send()
        try await harness.transport.waitFor(publishB)
        #expect(owner.busy)
        #expect(owner.pending[0].stage == .published)
        #expect(owner.pending[1].stage == .uploading)
        #expect(owner.completedBatch == 0)
        await secondPublishGate.release()
        try await waitForBatch(owner)
        #expect(owner.pending[0].stage == .published)
        #expect(owner.pending[1].stage == .failed)
        owner.setCaption("Не менять неопределённую публикацию", for: second.id)
        #expect(owner.pending[1].caption == "Правила перед встречей")
        #expect(owner.completed.map(\.id) == [a.id])
        await harness.transport.enqueue(
            base + "/media/" + b.id.uuidString.lowercased() + "/content", data: try envelope(b))
        await harness.transport.enqueue(publishB, data: try envelope(b))
        owner.send()
        try await waitForBatch(owner)
        #expect(owner.completedBatch == 1)
        #expect(owner.pending[0].stage == .published)
        #expect(owner.pending[1].stage == .published)
        #expect(await harness.transport.count(base + "/media/uploads") == 2)
        let requests = await harness.transport.requests
        let attempts = requests.filter { $0.url?.path == publishB }
        #expect(attempts.count == 2)
        #expect(attempts[0].httpBody == attempts[1].httpBody)
        let body = try #require(attempts[0].httpBody)
        let input = try JSONDecoder().decode([String: String].self, from: body)
        #expect(input["caption"] == "Правила перед встречей")
        #expect(
            attempts[0].value(forHTTPHeaderField: "Idempotency-Key")
                == attempts[1].value(forHTTPHeaderField: "Idempotency-Key"))
        let upload = try #require(requests.first { $0.httpMethod == "PUT" })
        #expect(upload.value(forHTTPHeaderField: "Content-Type") == "text/plain")
        #expect(upload.httpBody == Data("test".utf8))
    }
}

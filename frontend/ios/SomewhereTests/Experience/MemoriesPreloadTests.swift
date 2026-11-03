import Foundation
import Testing

@testable import Somewhere

@MainActor
struct MemoriesPreloadTests {
    private func page(_ photos: [MeetingMedia], cursor: String? = nil) throws -> Data {
        struct Page: Encodable {
            let photos: [MeetingMedia]
            let nextCursor: String?
            enum CodingKeys: String, CodingKey {
                case photos
                case nextCursor = "next_cursor"
            }
        }
        return try APICoding.encode(Page(photos: photos, nextCursor: cursor))
    }

    @Test func loadsThreePagesAndPreparesEveryPhotoBeforeOfflineReuse() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let album = try AlbumSourceFake(count: 103)
        let owner = MemoriesOwner(id: album.meetingID, session: harness.session)
        owner.meeting = try Fixtures.meeting(album.meetingID)
        let path = "/api/v1/meetings/" + album.meetingID.uuidString.lowercased() + "/memories"
        await harness.transport.enqueue(
            path, data: try page(Array(album.media.prefix(50)), cursor: "page-2"))
        await harness.transport.enqueue(
            path, data: try page(Array(album.media[50..<100]), cursor: "page-3"))
        await harness.transport.enqueue(path, data: try page(Array(album.media.suffix(3))))
        await owner.load()
        #expect(owner.photos.count == 103 && owner.nextCursor == nil && !owner.failed)
        let queries = await harness.transport.requests.filter { $0.url?.path == path }.map {
            $0.url?.query ?? ""
        }
        #expect(
            queries.count == 3 && queries[1].contains("cursor=page-2")
                && queries[2].contains("cursor=page-3"))
        let image = try CoverFixtures.jpeg()
        for photo in album.media {
            let content = try harness.session.api.origin.url(for: ExperienceRequests.content(photo))
                .path
            await harness.transport.enqueue(content, data: image, mime: "image/jpeg")
        }
        await owner.prefetch(around: 102)
        let before = await harness.transport.requests.count
        for photo in owner.photos {
            let content = MediaContentOwner(media: photo, session: harness.session)
            #expect(content.image != nil)
            await content.load()
            #expect(!content.failed)
        }
        #expect(await harness.transport.requests.count == before)
        harness.session.updateMeetingAccess(album.meetingID, allowed: false)
        #expect(
            album.media.allSatisfy { harness.session.privateData.mediaCache.value($0.id) == nil })
    }

    @Test func repeatedCursorStopsAndPageFailureKeepsEarlierPhotosRetryable() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let album = try AlbumSourceFake(count: 2)
        let owner = MemoriesOwner(id: album.meetingID, session: harness.session)
        owner.meeting = try Fixtures.meeting(album.meetingID)
        let path = "/api/v1/meetings/" + album.meetingID.uuidString.lowercased() + "/memories"
        await harness.transport.enqueue(path, data: try page([album.media[0]], cursor: "next"))
        await harness.transport.enqueue(path, status: 503)
        await owner.load()
        #expect(owner.failed && owner.photos.count == 1 && owner.nextCursor == "next")
        await harness.transport.enqueue(path, data: try page([album.media[1]]))
        await owner.load(more: true)
        #expect(!owner.failed && owner.photos.count == 2 && owner.nextCursor == nil)
        await harness.transport.enqueue(path, data: try page(album.media, cursor: "loop"))
        await harness.transport.enqueue(path, data: try page(album.media, cursor: "loop"))
        await owner.load()
        #expect(owner.failed && owner.photos.count == 2)
        #expect(await harness.transport.count(path) == 5)
    }
}

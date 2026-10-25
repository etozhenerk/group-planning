import Foundation
import ImageIO
import Testing

@testable import Somewhere

struct CoverProcessingTests {
    @Test func largeCameraPhotoIsDownsampledAndOrientationIsApplied() async throws {
        let file = try CoverFixtures.file(
            CoverFixtures.jpeg(width: 3200, height: 1800, orientation: 6))
        defer { try? FileManager.default.removeItem(at: file) }
        let processor = CoverImageProcessor()
        let cover = try await processor.prepare(file: file)
        #expect(cover.mediaType == "image/jpeg" && cover.data.count < 2 * 1024 * 1024)
        let image = try await processor.preview(cover.data)
        #expect(image.width == 900 && image.height == 1600)
        let source = try #require(CGImageSourceCreateWithData(cover.data as CFData, nil))
        let properties = try #require(
            CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any])
        #expect(properties[kCGImagePropertyOrientation] as? Int != 6)
    }

    @Test func deniedMissingCorruptAndOversizedFilesAreRejected() async throws {
        let processor = CoverImageProcessor()
        let missing = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        await #expect(throws: (any Error).self) { try await processor.prepare(file: missing) }
        let bad = try CoverFixtures.file(Data("not a picture".utf8))
        defer { try? FileManager.default.removeItem(at: bad) }
        await #expect(throws: CoverIssue.self) { try await processor.prepare(file: bad) }
        let handle = try FileHandle(forWritingTo: bad)
        try handle.truncate(atOffset: 50 * 1024 * 1024 + 1)
        try handle.close()
        await #expect(throws: CoverIssue.self) { try await processor.prepare(file: bad) }
    }

    @Test func creationAndSettingsEncodePhotoRetainAndRemoval() throws {
        var draft = MeetingDraftTests.filled()
        let cover = try CoverFixtures.cover()
        draft.cover = .image(cover)
        let input = try draft.input()
        #expect(input.cover == cover)
        let record = DraftRecord(ownerID: UUID(), value: draft, submission: input)
        #expect(try APICoding.decode(DraftRecord.self, from: APICoding.encode(record)) == record)
        var patch = UpdateMeeting(expectedRevision: .zero)
        let retained = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(patch)) as? [String: Any])
        #expect(retained["cover"] == nil)
        patch.cover = .value(cover)
        let replaced = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(patch)) as? [String: Any])
        let photo = try #require(replaced["cover"] as? [String: String])
        #expect(
            photo["media_type"] == "image/jpeg" && photo["data"] == cover.data.base64EncodedString()
        )
        patch.cover = .clear
        let removed = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(patch)) as? [String: Any])
        #expect(removed["cover"] is NSNull)
    }
}

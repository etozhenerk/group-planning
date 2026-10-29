import Foundation
import Testing

@testable import Somewhere

@MainActor @Suite(.serialized)
struct AlbumDownloadTests {
    @Test func fullSnapshotUsesOriginalBytesOnceAndExcludesNewPhotos() async throws {
        let harness = try AlbumHarness(count: 103)
        let ids = harness.source.media.map(\.id)
        harness.source.onDownload = {
            harness.source.media.append(try harness.source.photo())
        }
        let operation = UUID()
        #expect(try await harness.service.save(operationID: operation) == 103)
        #expect(try await harness.service.save(operationID: operation) == 103)
        #expect(harness.source.snapshotCalls == 1)
        #expect(harness.source.downloaded == ids)
        #expect(harness.source.verifyCalls == 1)
        #expect(harness.library.saved.count == 1)
        #expect(harness.library.saved[0].allSatisfy { $0 == harness.source.data })
        #expect(Set(harness.library.names).count == 103)
        #expect(harness.library.names.allSatisfy { !$0.contains("/") })
        try harness.expectClean()
    }

    @Test func permissionDeniedDoesNotDownloadOrCreateFiles() async throws {
        let harness = try AlbumHarness()
        harness.library.denied = true
        await #expect(throws: AlbumSaveFailure.permissionRequired) {
            try await harness.service.save(operationID: UUID())
        }
        #expect(harness.source.snapshotCalls == 0)
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func revocationAfterLateDownloadCleansEverythingWithoutSaving() async throws {
        let harness = try AlbumHarness()
        harness.source.onDownload = { harness.source.revoked = true }
        await #expect(throws: ClientFailure.accessRevoked) {
            try await harness.service.save(operationID: UUID())
        }
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func revocationAtFinalVerificationDoesNotCommit() async throws {
        let harness = try AlbumHarness()
        harness.source.onVerify = { harness.source.revoked = true }
        await #expect(throws: ClientFailure.accessRevoked) {
            try await harness.service.save(operationID: UUID())
        }
        #expect(harness.source.downloaded.count == 2)
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func cancellationBeforeCommitAndConcurrentTapCannotSave() async throws {
        let harness = try AlbumHarness()
        var worker: Task<Int, any Error>?
        harness.source.onDownload = {
            await #expect(throws: AlbumSaveFailure.busy) {
                try await harness.service.save(operationID: UUID())
            }
            worker?.cancel()
        }
        worker = Task { try await harness.service.save(operationID: UUID()) }
        await #expect(throws: CancellationError.self) { try await worker?.value }
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func cancellationAfterCommitStartsWaitsForOutcomeAndCleans() async throws {
        let harness = try AlbumHarness()
        let operation = UUID()
        var worker: Task<Int, any Error>?
        harness.library.onSave = {
            worker?.cancel()
            harness.source.revoked = true
            await Task.yield()
        }
        worker = Task { try await harness.service.save(operationID: operation) }
        #expect(try await worker?.value == 2)
        #expect(harness.library.saved.count == 1)
        try harness.expectClean()
    }

    @Test func partialDownloadAndGalleryFailureCleanFiles() async throws {
        let harness = try AlbumHarness()
        harness.source.data = Data([1])
        await #expect(throws: ClientFailure.invalidResponse) {
            try await harness.service.save(operationID: UUID())
        }
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
        let gallery = try AlbumHarness()
        gallery.library.onSave = { throw AlbumSaveFailure.photoLibrary }
        await #expect(throws: AlbumSaveFailure.photoLibrary) {
            try await gallery.service.save(operationID: UUID())
        }
        try gallery.expectClean()
    }

    @Test func snapshotRejectsDuplicatesWrongPurposeOversizeAndPagination() throws {
        let source = try AlbumSourceFake()
        let duplicate = source.media + source.media
        #expect(throws: AlbumSaveFailure.invalidSnapshot) {
            try AlbumPhoto.validate(MemorySnapshot(photos: duplicate), meetingID: source.meetingID)
        }
        for media in [
            try source.photo(size: AlbumPhoto.maximumPhotoBytes + 1),
            try source.photo(purpose: "chat"),
        ] {
            #expect(throws: AlbumSaveFailure.invalidSnapshot) {
                try AlbumPhoto.validate(
                    MemorySnapshot(photos: [media]), meetingID: source.meetingID)
            }
        }
        let oversized = try (0..<103).map { _ in
            try source.photo(size: AlbumPhoto.maximumPhotoBytes)
        }
        #expect(throws: AlbumSaveFailure.invalidSnapshot) {
            try AlbumPhoto.validate(MemorySnapshot(photos: oversized), meetingID: source.meetingID)
        }
        for json in ["{\"photos\":[]}", "{\"photos\":[],\"next_cursor\":\"next\"}"] {
            #expect(throws: (any Error).self) {
                try JSONDecoder().decode(MemorySnapshot.self, from: Data(json.utf8))
            }
        }
    }
}

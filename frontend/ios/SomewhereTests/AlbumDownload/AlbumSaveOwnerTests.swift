import Foundation
import Testing

@testable import Somewhere

extension AlbumDownloadTests {
    @Test func duplicateTapAndCancellationIgnoreLateDownload() async throws {
        let harness = try AlbumHarness()
        let gate = TestGate()
        harness.source.onDownload = { await gate.wait() }
        let owner = AlbumSaveOwner(makeService: { harness.service }, current: { true })
        owner.start()
        owner.start()
        for _ in 0..<200 {
            if !harness.source.downloaded.isEmpty { break }
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(owner.state == .preparing)
        #expect(harness.source.snapshotCalls == 1)
        owner.cancel()
        owner.start()
        #expect(owner.state == .idle)
        #expect(owner.working)
        await gate.release()
        await owner.waitUntilFinished()
        #expect(owner.state == .idle)
        #expect(!owner.working)
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func systemCommitCannotBeCancelledAndOnlyThenReportsSuccess() async throws {
        let harness = try AlbumHarness()
        let owner = AlbumSaveOwner(makeService: { harness.service }, current: { true })
        harness.library.onSave = {
            #expect(owner.state == .saving)
            owner.cancel()
            #expect(owner.state == .saving)
        }
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .saved(2))
        #expect(harness.library.saved.count == 1)
        try harness.expectClean()
    }

    @Test func permissionReturnNeedsGrantedAccessBeforeRetry() async throws {
        let harness = try AlbumHarness()
        harness.library.denied = true
        let owner = AlbumSaveOwner(
            makeService: { harness.service }, current: { true },
            permissionGranted: { !harness.library.denied })
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .permissionRequired)
        owner.permissionMayHaveChanged()
        #expect(owner.state == .permissionRequired)
        harness.library.denied = false
        owner.permissionMayHaveChanged()
        #expect(owner.state == .idle)
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .saved(2))
        try harness.expectClean()
    }

    @Test func leavingDuringCommitDoesNotShowLateSuccess() async throws {
        let harness = try AlbumHarness()
        let owner = AlbumSaveOwner(makeService: { harness.service }, current: { true })
        harness.library.onSave = { owner.suspend() }
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .idle)
        #expect(!owner.working)
        #expect(harness.library.saved.count == 1)
        try harness.expectClean()
    }

    @Test func revokedOwnerDoesNotAcceptLateResultOrStartAgain() async throws {
        let harness = try AlbumHarness()
        var current = true
        let owner = AlbumSaveOwner(makeService: { harness.service }, current: { current })
        harness.source.onDownload = {
            current = false
            owner.suspend()
        }
        owner.start()
        await owner.waitUntilFinished()
        owner.start()
        #expect(owner.state == .idle)
        #expect(harness.source.snapshotCalls == 1)
        #expect(harness.library.saved.isEmpty)
        try harness.expectClean()
    }

    @Test func networkAndSystemErrorsHaveDistinctRetryStates() async throws {
        let harness = try AlbumHarness()
        let owner = AlbumSaveOwner(makeService: { harness.service }, current: { true })
        harness.source.onDownload = { throw URLError(.notConnectedToInternet) }
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .preparationFailed)
        harness.source.onDownload = nil
        harness.library.onSave = { throw AlbumSaveFailure.photoLibrary }
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .saveFailed)
        harness.library.onSave = nil
        owner.start()
        await owner.waitUntilFinished()
        #expect(owner.state == .saved(2))
        try harness.expectClean()
    }
}

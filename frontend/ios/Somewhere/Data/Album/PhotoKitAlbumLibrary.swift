import Foundation
import Photos

@MainActor
struct PhotoKitAlbumLibrary: AlbumPhotoLibrary {
    func requireAddPermission() async throws {
        var status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        if status == .notDetermined {
            status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
        }
        guard status == .authorized else { throw AlbumSaveFailure.permissionRequired }
    }

    func save(_ photos: [AlbumPreparedPhoto]) async throws {
        guard !photos.isEmpty else { throw AlbumSaveFailure.empty }
        guard PHPhotoLibrary.authorizationStatus(for: .addOnly) == .authorized else {
            throw AlbumSaveFailure.permissionRequired
        }
        // File resources preserve the bytes and EXIF; no UIImage/JPEG round trip.
        try await withCheckedThrowingContinuation {
            (continuation: CheckedContinuation<Void, any Error>) in
            PHPhotoLibrary.shared().performChanges {
                for item in photos {
                    let request = PHAssetCreationRequest.forAsset()
                    let options = PHAssetResourceCreationOptions()
                    options.originalFilename = item.photo.fileName
                    options.shouldMoveFile = false
                    request.addResource(with: .photo, fileURL: item.fileURL, options: options)
                }
            } completionHandler: { saved, _ in
                if saved {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: AlbumSaveFailure.photoLibrary)
                }
            }
        }
    }
}

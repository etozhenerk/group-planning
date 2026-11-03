import Foundation
import Observation

@MainActor @Observable
final class MemoriesOwner: Identifiable {
    let id: UUID
    let session: SessionStore
    let transfer: MediaTransferOwner
    let albumSave: AlbumSaveOwner
    private let lease: PrivateData.Lease?
    var photos: [MeetingMedia] = []
    var meeting: Meeting?
    var nextCursor: String?
    var loading = false
    var failed = false
    var loaded = false
    init(id: UUID, session: SessionStore) {
        self.id = id
        self.session = session
        transfer = MediaTransferOwner(id: id, session: session, purpose: "memory")
        let lease = try? session.privateData.lease(for: id)
        self.lease = lease
        albumSave = AlbumSaveOwner(
            makeService: {
                try AlbumDownloadService(
                    source: SessionAlbumSource(meetingID: id, session: session),
                    library: PhotoKitAlbumLibrary())
            },
            current: {
                session.status == .authenticated
                    && lease.map { session.privateData.isCurrent($0) } == true
            }, permissionGranted: { PhotoKitAlbumLibrary.canAddPhotos })
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load(more: Bool = false) async {
        guard current, !loading else { return }
        loading = true
        failed = false
        defer { loading = false }
        do {
            if meeting == nil {
                let value = try await session.send(MeetingRequests.details(id), as: Meeting.self)
                try Task.checkCancellation()
                guard current, value.id == id, value.period == "past" else { return }
                meeting = value
            }
            var combined = more ? photos : []
            var cursor = more ? nextCursor : nil
            var visited: Set<String> = []
            repeat {
                let result = try await session.send(
                    ExperienceRequests.memories(id, cursor: cursor), as: MediaPage.self)
                try Task.checkCancellation()
                guard current else { return }
                guard result.photos.allSatisfy({ $0.meetingID == id && $0.purpose == "memory" })
                else {
                    throw ClientFailure.invalidResponse
                }
                for photo in result.photos where !combined.contains(where: { $0.id == photo.id }) {
                    combined.append(photo)
                }
                photos = combined
                nextCursor = result.nextCursor
                loaded = true
                cursor = result.nextCursor
                if let cursor, !visited.insert(cursor).inserted {
                    throw ClientFailure.invalidResponse
                }
            } while cursor != nil
        } catch { if current, !(error is CancellationError) { failed = true } }
    }
    func prefetch(around selection: Int) async {
        guard current, !photos.isEmpty else { return }
        // Warm every available page serially, starting with the visible photo.
        // PrivateMediaCache still bounds retained bytes and decoded images.
        for delta in photos.indices {
            guard current, !Task.isCancelled else { return }
            let photo = photos[(selection + delta + photos.count) % photos.count]
            if session.privateData.mediaCache.value(photo.id) != nil { continue }
            let content = MediaContentOwner(media: photo, session: session)
            await content.load()
        }
    }

    func clear() {
        albumSave.suspend()
        transfer.suspend()
        photos = []
        meeting = nil
        nextCursor = nil
        loaded = false
    }
}

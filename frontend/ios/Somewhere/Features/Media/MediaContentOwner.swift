import Foundation
import ImageIO
import Observation
import UIKit

@MainActor @Observable
final class MediaContentOwner {
    let media: MeetingMedia
    let session: SessionStore
    private let lease: PrivateData.Lease?
    var data: Data?
    var image: UIImage?
    var loading = false
    var failed = false
    private var generation = UUID()
    init(media: MeetingMedia, session: SessionStore) {
        self.media = media
        self.session = session
        lease = try? session.privateData.lease(for: media.meetingID)
        if current, let cached = session.privateData.mediaCache.value(media.id) {
            data = cached.data
            image = cached.image
        }
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load() async {
        guard current, data == nil, !loading else { return }
        if let cached = session.privateData.mediaCache.value(media.id) {
            data = cached.data
            image = cached.image
            return
        }
        let version = generation
        loading = true
        failed = false
        defer { if version == generation { loading = false } }
        do {
            let result = try await session.media(ExperienceRequests.content(media))
            try Task.checkCancellation()
            guard current, version == generation else { return }
            let display =
                media.kind == "photo" ? try await MediaDisplayDecoder().image(result) : nil
            try Task.checkCancellation()
            guard current, version == generation else { return }
            data = result
            image = display.map { UIImage(cgImage: $0) }
            session.privateData.mediaCache.store(
                .init(meeting: media.meetingID, data: result, image: image), id: media.id)
        } catch {
            if current, version == generation, !(error is CancellationError) { failed = true }
        }
    }
    func clear() {
        generation = UUID()
        data = nil
        image = nil
        loading = false
    }
}

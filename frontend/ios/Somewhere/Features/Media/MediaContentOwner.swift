import Foundation
import ImageIO
import Observation

@MainActor @Observable
final class MediaContentOwner {
    let media: MeetingMedia
    let session: SessionStore
    private let lease: PrivateData.Lease?
    var data: Data?
    var loading = false
    var failed = false
    private var generation = UUID()
    init(media: MeetingMedia, session: SessionStore) {
        self.media = media
        self.session = session
        lease = try? session.privateData.lease(for: media.meetingID)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load() async {
        guard current, data == nil, !loading else { return }
        let version = generation
        loading = true
        failed = false
        defer { if version == generation { loading = false } }
        do {
            let result = try await session.media(ExperienceRequests.content(media))
            try Task.checkCancellation()
            guard current, version == generation else { return }
            if media.kind == "photo" {
                guard let source = CGImageSourceCreateWithData(result as CFData, nil),
                    CGImageSourceGetCount(source) > 0
                else { throw ClientFailure.invalidResponse }
            }
            data = result
        } catch {
            if current, version == generation, !(error is CancellationError) { failed = true }
        }
    }
    func clear() {
        generation = UUID()
        data = nil
        loading = false
    }
}

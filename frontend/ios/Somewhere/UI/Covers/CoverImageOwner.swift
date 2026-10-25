import Foundation
import ImageIO
import Observation

enum CoverImageSource: Hashable, Sendable {
    case prepared(PreparedCover)
    case remote(URL, UUID)
}

@MainActor @Observable
final class CoverImageOwner {
    private let api: APIClient?
    private let session: SessionStore?
    private let processor = CoverImageProcessor()
    private var pixels: CGImage?
    private var lease: PrivateData.Lease?
    private var generation = UUID()
    private(set) var loading = true
    private(set) var requestedSource: CoverImageSource?

    init(api: APIClient?, session: SessionStore?) {
        self.api = api
        self.session = session
    }

    var image: CGImage? {
        if let lease, session?.privateData.isCurrent(lease) != true { return nil }
        return pixels
    }

    func load(_ source: CoverImageSource) async {
        clear()
        let version = generation
        requestedSource = source
        loading = true
        defer { if version == generation { loading = false } }
        do {
            let data: Data
            switch source {
            case .prepared(let cover): data = cover.data
            case .remote(let url, let meetingID):
                guard let api else { throw ClientFailure.invalidOrigin }
                let request = try CoverRequests.read(url, meetingID: meetingID, origin: api.origin)
                if request.meetingID != nil {
                    guard let session, session.status == .authenticated else {
                        throw ClientFailure.staleSession
                    }
                    lease = try session.privateData.lease(for: meetingID)
                    data = try await session.image(request)
                } else {
                    data = try await api.image(request)
                }
            }
            let image = try await processor.preview(data)
            try Task.checkCancellation()
            guard version == generation,
                lease.map({ session?.privateData.isCurrent($0) == true }) ?? true
            else { return }
            pixels = image
        } catch {
            if version == generation { pixels = nil }
        }
    }

    func clear() {
        generation = UUID()
        pixels = nil
        lease = nil
        loading = true
        requestedSource = nil
    }
}

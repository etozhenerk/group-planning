import ImageIO
import Observation
import SwiftUI

@MainActor @Observable
final class AvatarImages {
    private(set) var images: [URL: UIImage] = [:]
    private var order: [URL] = []
    @ObservationIgnored private var requests: [URL: Task<Void, Never>] = [:]
    private var generation = UUID()

    func load(_ url: URL) async {
        guard url.scheme == "https", url.user == nil, url.password == nil, images[url] == nil else {
            return
        }
        if let request = requests[url] {
            await request.value
            return
        }
        let version = generation
        let request = Task {
            defer { if generation == version { requests[url] = nil } }
            do {
                let (data, response) = try await URLSession.shared.data(from: url)
                try Task.checkCancellation()
                guard generation == version, let response = response as? HTTPURLResponse,
                    response.statusCode == 200, data.count <= 5 * 1024 * 1024,
                    response.mimeType?.hasPrefix("image/") == true,
                    let source = CGImageSourceCreateWithData(data as CFData, nil),
                    let thumbnail = CGImageSourceCreateThumbnailAtIndex(
                        source, 0,
                        [
                            kCGImageSourceCreateThumbnailFromImageAlways: true,
                            kCGImageSourceThumbnailMaxPixelSize: 256,
                            kCGImageSourceCreateThumbnailWithTransform: true,
                        ] as CFDictionary)
                else { return }
                images[url] = UIImage(cgImage: thumbnail)
                order.append(url)
                while order.count > 100 { images.removeValue(forKey: order.removeFirst()) }
            } catch {
                // Keep the neutral placeholder; a later appearance can retry.
            }
        }
        requests[url] = request
        await request.value
    }

    func clear() {
        generation = UUID()
        for request in requests.values { request.cancel() }
        requests = [:]
        images = [:]
        order = []
    }
}

private struct AvatarImagesKey: EnvironmentKey {
    static let defaultValue: AvatarImages? = nil
}

extension EnvironmentValues {
    var avatarImages: AvatarImages? {
        get { self[AvatarImagesKey.self] }
        set { self[AvatarImagesKey.self] = newValue }
    }
}

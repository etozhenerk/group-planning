import Foundation
import ImageIO

/// Decode a bounded display representation off the UI actor; the original bytes stay unchanged.
actor MediaDisplayDecoder {
    func image(_ data: Data) throws -> CGImage {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
            let image = CGImageSourceCreateThumbnailAtIndex(
                source, 0,
                [
                    kCGImageSourceCreateThumbnailFromImageAlways: true,
                    kCGImageSourceThumbnailMaxPixelSize: 2048,
                    kCGImageSourceCreateThumbnailWithTransform: true,
                    kCGImageSourceShouldCacheImmediately: true,
                ] as CFDictionary)
        else { throw ClientFailure.invalidResponse }
        return image
    }
}

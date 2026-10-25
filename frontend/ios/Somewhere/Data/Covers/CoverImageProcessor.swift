import Foundation
import ImageIO
import UniformTypeIdentifiers

actor CoverImageProcessor {
    func prepare(file: URL) throws -> PreparedCover {
        try Task.checkCancellation()
        let values = try file.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
        guard values.isRegularFile == true else { throw CoverIssue.unreadable }
        guard let size = values.fileSize, size > 0, size <= 50 * 1024 * 1024 else {
            throw CoverIssue.tooLarge
        }
        guard
            let source = CGImageSourceCreateWithURL(
                file as CFURL, [kCGImageSourceShouldCache: false] as CFDictionary)
        else { throw CoverIssue.unreadable }
        let image = try thumbnail(source, maxPixels: 64_000_000)
        let output = NSMutableData()
        guard
            let destination = CGImageDestinationCreateWithData(
                output, UTType.jpeg.identifier as CFString, 1, nil)
        else { throw CoverIssue.unreadable }
        CGImageDestinationAddImage(
            destination, try opaque(image),
            [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { throw CoverIssue.unreadable }
        guard output.length <= 2 * 1024 * 1024 else { throw CoverIssue.tooLarge }
        try Task.checkCancellation()
        return PreparedCover(mediaType: "image/jpeg", data: output as Data)
    }

    func preview(_ data: Data) throws -> CGImage {
        try Task.checkCancellation()
        guard data.count <= 5 * 1024 * 1024,
            let source = CGImageSourceCreateWithData(
                data as CFData, [kCGImageSourceShouldCache: false] as CFDictionary),
            let type = CGImageSourceGetType(source),
            [UTType.jpeg.identifier, UTType.png.identifier].contains(type as String)
        else { throw CoverIssue.unreadable }
        return try thumbnail(source, maxPixels: 16_000_000)
    }

    private func thumbnail(_ source: CGImageSource, maxPixels: Int) throws -> CGImage {
        guard CGImageSourceGetCount(source) == 1,
            let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
            let width = properties[kCGImagePropertyPixelWidth] as? Int,
            let height = properties[kCGImagePropertyPixelHeight] as? Int,
            width > 0, height > 0
        else { throw CoverIssue.unreadable }
        guard width <= 32768, height <= 32768, width * height <= maxPixels else {
            throw CoverIssue.tooLarge
        }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: 1600,
            kCGImageSourceShouldCacheImmediately: true,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
        else { throw CoverIssue.unreadable }
        try Task.checkCancellation()
        return image
    }

    private func opaque(_ image: CGImage) throws -> CGImage {
        guard
            let context = CGContext(
                data: nil, width: image.width, height: image.height, bitsPerComponent: 8,
                bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
        else { throw CoverIssue.unreadable }
        let bounds = CGRect(x: 0, y: 0, width: CGFloat(image.width), height: CGFloat(image.height))
        context.setFillColor(CGColor(gray: 1, alpha: 1))
        context.fill(bounds)
        context.draw(image, in: bounds)
        guard let result = context.makeImage() else { throw CoverIssue.unreadable }
        return result
    }
}

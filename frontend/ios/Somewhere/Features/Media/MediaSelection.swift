import Foundation
import ImageIO
import UniformTypeIdentifiers

/// ImageIO re-encodes picked photos, removing location and other source metadata.
enum MediaSelection {
    static func photo(_ data: Data, name: String = "Фото.jpg") throws -> PendingMedia {
        guard data.count <= 40 * 1024 * 1024,
            let source = CGImageSourceCreateWithData(data as CFData, nil),
            let image = CGImageSourceCreateThumbnailAtIndex(
                source, 0,
                [
                    kCGImageSourceCreateThumbnailFromImageAlways: true,
                    kCGImageSourceThumbnailMaxPixelSize: 4096,
                    kCGImageSourceCreateThumbnailWithTransform: true,
                ] as CFDictionary)
        else { throw ClientFailure.invalidRequest }
        let output = NSMutableData()
        guard
            let destination = CGImageDestinationCreateWithData(
                output, UTType.jpeg.identifier as CFString, 1, nil)
        else { throw ClientFailure.invalidRequest }
        CGImageDestinationAddImage(
            destination, image, [kCGImageDestinationLossyCompressionQuality: 0.88] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { throw ClientFailure.invalidRequest }
        return PendingMedia(
            id: UUID(), publishKey: UUID(), name: name, contentType: "image/jpeg",
            data: output as Data)
    }
    static func file(_ url: URL) throws -> PendingMedia {
        let granted = url.startAccessingSecurityScopedResource()
        defer { if granted { url.stopAccessingSecurityScopedResource() } }
        let values = try url.resourceValues(forKeys: [
            .fileSizeKey, .isRegularFileKey, .contentTypeKey,
        ])
        guard values.isRegularFile == true, let size = values.fileSize, size > 0,
            size <= 20 * 1024 * 1024
        else {
            throw ClientFailure.invalidRequest
        }
        let data = try Data(contentsOf: url)
        let declared = values.contentType?.preferredMIMEType
        let contentType =
            declared == nil || declared == "application/octet-stream"
            ? UTType(filenameExtension: url.pathExtension)?.preferredMIMEType
                ?? "application/octet-stream"
            : declared ?? "application/octet-stream"
        return PendingMedia(
            id: UUID(), publishKey: UUID(), name: url.lastPathComponent,
            contentType: contentType,
            data: data)
    }
}

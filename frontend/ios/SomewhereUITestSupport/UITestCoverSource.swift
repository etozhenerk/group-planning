import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

actor UITestCoverSource: CoverSelectionSource {
    private var selections = 0
    func select() async throws -> PreparedCover? {
        selections += 1
        try await Task.sleep(for: .milliseconds(250))
        if selections == 2 { throw CoverIssue.unreadable }
        if selections == 3 { return nil }
        guard
            let context = CGContext(
                data: nil, width: 1800, height: 1200, bitsPerComponent: 8, bytesPerRow: 0,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
            )
        else { throw CoverIssue.unreadable }
        context.setFillColor(CGColor(red: 0.12, green: 0.65, blue: 0.55, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: 1800, height: 1200))
        context.setFillColor(CGColor(red: 0.7, green: 0.25, blue: 0.4, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: 600, height: 1200))
        guard let image = context.makeImage() else { throw CoverIssue.unreadable }
        let file = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jpg")
        defer { try? FileManager.default.removeItem(at: file) }
        guard
            let destination = CGImageDestinationCreateWithURL(
                file as CFURL, UTType.jpeg.identifier as CFString, 1, nil
            )
        else { throw CoverIssue.unreadable }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else { throw CoverIssue.unreadable }
        return try await CoverImageProcessor().prepare(file: file)
    }
}

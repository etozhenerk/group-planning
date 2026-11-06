import UIKit
import XCTest

@MainActor
enum MessageBubbleFrameEvidence {
    static func size(of row: XCUIElement, name: String) throws -> CGSize {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let tokens = try XCTUnwrap(
            JSONSerialization.jsonObject(
                with: Data(contentsOf: root.appendingPathComponent("design-system/tokens.json")))
                as? [String: Any])
        let palette = try XCTUnwrap(tokens["palette"] as? [String: Any])
        let own = try XCTUnwrap(palette["ownMessage"] as? [String: Any])
        let color = try XCTUnwrap(own["$value"] as? [String: Any])
        let channels = try XCTUnwrap(color["components"] as? [Double]).map {
            Int(($0 * 255).rounded())
        }
        XCTAssertEqual(channels.count, 3)
        let background = try XCTUnwrap(palette["background"] as? [String: Any])
        let backgroundColor = try XCTUnwrap(background["$value"] as? [String: Any])
        let backgroundChannels = try XCTUnwrap(backgroundColor["components"] as? [Double])
            .map { Int(($0 * 255).rounded()) }
        let component = try XCTUnwrap(tokens["component"] as? [String: Any])
        let chat = try XCTUnwrap(component["mobileChat"] as? [String: Any])
        let avatar = try XCTUnwrap(chat["messageAvatar"] as? [String: Any])
        let dimension = try XCTUnwrap(avatar["$value"] as? [String: Any])
        let avatarWidth = try XCTUnwrap(dimension["value"] as? Double)

        let frame = row.frame
        let image = try XCTUnwrap(row.screenshot().image.cgImage)
        let scale = CGFloat(image.width) / frame.width
        var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
        try pixels.withUnsafeMutableBytes { buffer in
            let context = try XCTUnwrap(
                CGContext(
                    data: buffer.baseAddress, width: image.width, height: image.height,
                    bitsPerComponent: 8, bytesPerRow: image.width * 4,
                    space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                        | CGBitmapInfo.byteOrder32Big.rawValue))
            context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        }
        var minimumX = image.width
        var minimumY = image.height
        var maximumX = -1
        var maximumY = -1
        var matches = 0
        // The own avatar is outside the bubble; its photo must not extend the paint bounds.
        let endX = max(0, image.width - Int(avatarWidth * scale))
        for y in 0..<image.height {
            for x in 0..<endX {
                let offset = (y * image.width + x) * 4
                let ratios = (0..<3).map {
                    Double(Int(pixels[offset + $0]) - backgroundChannels[$0])
                        / Double(channels[$0] - backgroundChannels[$0])
                }
                let coverage = ratios.reduce(0, +) / 3
                // Scroll-edge compositing shades the fill. Its half-coverage contour includes
                // the full silhouette while excluding the background and outward shadow.
                guard pixels[offset + 3] > 250, coverage >= 0.5, coverage <= 1.05,
                    ratios.allSatisfy({ abs($0 - coverage) <= 0.08 })
                else { continue }
                minimumX = min(minimumX, x)
                minimumY = min(minimumY, y)
                maximumX = max(maximumX, x)
                maximumY = max(maximumY, y)
                matches += 1
            }
        }
        XCTAssertGreaterThan(matches, 100, "The published own-message fill must be visible")
        let size = CGSize(
            width: CGFloat(maximumX - minimumX + 1) / scale,
            height: CGFloat(maximumY - minimumY + 1) / scale)
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(
            "somewhere-design-verification/message-bubble")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try XCTUnwrap(UIImage(cgImage: image).pngData()).write(
            to: directory.appendingPathComponent(name + ".png"))
        let metrics: [String: Any] = [
            "capturedAt": Date().timeIntervalSince1970,
            "rowAX": [frame.minX, frame.minY, frame.width, frame.height],
            "paintPixels": [minimumX, minimumY, maximumX, maximumY],
            "scale": scale, "matchingPixels": matches,
            "paintSize": [size.width, size.height],
        ]
        let path = directory.appendingPathComponent(name + ".json")
        try JSONSerialization.data(withJSONObject: metrics, options: [.sortedKeys]).write(to: path)
        print("SOMEWHERE_MESSAGE_BUBBLE_METRICS=" + path.path)
        return size
    }
}

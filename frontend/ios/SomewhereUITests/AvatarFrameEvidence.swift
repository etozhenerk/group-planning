import Foundation
import UIKit
import XCTest

@MainActor
final class AvatarFrameEvidence {
    private let directory = FileManager.default.temporaryDirectory.appendingPathComponent(
        "somewhere-design-verification/avatar-ack", isDirectory: true)
    private var records: [[String: Any]] = []
    private var baseline: CGRect?
    private var baselinePixels: [UInt8]?

    init() throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    @discardableResult
    func capture(_ row: XCUIElement, name: String, photo: Bool, fixed: Bool = true) throws -> Bool {
        let frame = row.frame
        // Published native avatar=28pt; label=11pt*1.4 plus its 4pt gap.
        let avatar = CGRect(x: frame.maxX - 28, y: frame.minY + 19.4, width: 28, height: 28)
        let app = XCUIApplication()
        guard app.frame.contains(avatar), let screen = XCUIScreen.main.screenshot().image.cgImage
        else { return false }
        let scale = CGFloat(screen.width) / app.frame.width
        let crop = CGRect(
            x: avatar.minX * scale, y: avatar.minY * scale,
            width: avatar.width * scale, height: avatar.height * scale
        ).integral
        let image = try XCTUnwrap(screen.cropping(to: crop))
        var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
        let context = try XCTUnwrap(
            CGContext(
                data: &pixels, width: image.width, height: image.height, bitsPerComponent: 8,
                bytesPerRow: image.width * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        let white = stride(from: 0, to: pixels.count, by: 4).filter {
            pixels[$0] > 240 && pixels[$0 + 1] > 240 && pixels[$0 + 2] > 240
        }.count
        let ratio = Double(white) / Double(image.width * image.height)
        let sand = stride(from: 0, to: pixels.count, by: 4).filter {
            Int(pixels[$0]) > 140 && Int(pixels[$0]) > Int(pixels[$0 + 1]) + 5
                && Int(pixels[$0 + 1]) > Int(pixels[$0 + 2]) + 5
        }.count
        let sandRatio = Double(sand) / Double(image.width * image.height)
        let matches = photo ? ratio > 0.1 : ratio < 0.01 && sandRatio > 0.5
        if matches, let baseline, fixed {
            XCTAssertEqual(avatar.minX, baseline.minX, accuracy: 1)
            XCTAssertEqual(avatar.minY, baseline.minY, accuracy: 1)
        } else if matches, baseline == nil {
            baseline = avatar
            baselinePixels = pixels
        }
        if matches, fixed, let baselinePixels, baselinePixels.count == pixels.count {
            let difference = zip(baselinePixels, pixels).reduce(0) {
                $0 + abs(Int($1.0) - Int($1.1))
            }
            XCTAssertLessThan(Double(difference) / Double(pixels.count * 255), 0.03)
        }
        let path = directory.appendingPathComponent(name + ".png")
        try XCTUnwrap(UIImage(cgImage: image).pngData()).write(to: path)
        records.append([
            "name": name, "capturedAt": Date().timeIntervalSince1970, "whiteRatio": ratio,
            "photo": photo, "matches": matches, "sandRatio": sandRatio,
            "avatar": [avatar.minX, avatar.minY, avatar.width, avatar.height],
            "row": [frame.minX, frame.minY, frame.width, frame.height],
        ])
        print("SOMEWHERE_AVATAR_FRAME=" + path.path)
        return matches
    }

    func finish(_ name: String) throws {
        let path = directory.appendingPathComponent(name + ".json")
        try JSONSerialization.data(withJSONObject: records, options: [.prettyPrinted, .sortedKeys])
            .write(to: path)
        print("SOMEWHERE_AVATAR_TRACE=" + path.path)
    }
}

import Foundation
import ImageIO
import Testing
import UIKit
import UniformTypeIdentifiers

@testable import Somewhere

@Suite("Bounded native photo display")
@MainActor
struct MediaDisplayTests {
    @Test func largePhotosKeepOriginalBytesAndFourDecodedNeighbours() async throws {
        let pixels = Data(repeating: 100, count: 4032 * 3024 * 4)
        let provider = try #require(CGDataProvider(data: pixels as CFData))
        let image = try #require(
            CGImage(
                width: 4032, height: 3024, bitsPerComponent: 8, bitsPerPixel: 32,
                bytesPerRow: 4032 * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.noneSkipLast.rawValue),
                provider: provider,
                decode: nil, shouldInterpolate: false, intent: .defaultIntent))
        let output = NSMutableData()
        let destination = try #require(
            CGImageDestinationCreateWithData(output, UTType.jpeg.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(destination, image, nil)
        #expect(CGImageDestinationFinalize(destination))
        let original = output as Data
        let display = try await MediaDisplayDecoder().image(original)
        #expect(display.width == 2048)
        #expect(display.height == 1536)
        let cache = PrivateMediaCache()
        let meeting = UUID()
        let keys = (0..<4).map { _ in UUID() }
        for key in keys {
            cache.store(
                .init(meeting: meeting, data: original, image: UIImage(cgImage: display)), id: key)
        }
        for key in keys {
            let value = try #require(cache.value(key))
            #expect(value.data == original)
            #expect(value.image?.cgImage?.width == 2048)
            #expect(value.image?.cgImage?.height == 1536)
        }
        cache.revoke(meeting)
        for key in keys { #expect(cache.value(key) == nil) }
    }

    @Test func exifRotatedPhotosStayPortraitAndKeepOppositeRotationDirections() async throws {
        let right = try await decoded(orientation: 6)
        let left = try await decoded(orientation: 8)
        #expect(right.width == 20 && right.height == 40)
        #expect(left.width == 20 && left.height == 40)
        let rightTop = try sample(right, y: 5)
        let rightBottom = try sample(right, y: 35)
        let leftTop = try sample(left, y: 5)
        let leftBottom = try sample(left, y: 35)
        #expect(abs(rightTop - rightBottom) > 150)
        #expect(abs(rightTop - leftBottom) < 20)
        #expect(abs(rightBottom - leftTop) < 20)
    }

    private func decoded(orientation: Int) async throws -> CGImage {
        var pixels = [UInt8]()
        for _ in 0..<20 {
            for x in 0..<40 { pixels += x < 20 ? [255, 0, 0, 255] : [0, 0, 255, 255] }
        }
        let provider = try #require(CGDataProvider(data: Data(pixels) as CFData))
        let image = try #require(
            CGImage(
                width: 40, height: 20, bitsPerComponent: 8, bitsPerPixel: 32,
                bytesPerRow: 40 * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.noneSkipLast.rawValue),
                provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent))
        let output = NSMutableData()
        let destination = try #require(
            CGImageDestinationCreateWithData(output, UTType.jpeg.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(
            destination, image, [kCGImagePropertyOrientation: orientation] as CFDictionary)
        #expect(CGImageDestinationFinalize(destination))
        return try await MediaDisplayDecoder().image(output as Data)
    }

    private func sample(_ image: CGImage, y: Int) throws -> Int {
        var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
        try pixels.withUnsafeMutableBytes { buffer in
            let context = try #require(
                CGContext(
                    data: buffer.baseAddress, width: image.width, height: image.height,
                    bitsPerComponent: 8, bytesPerRow: image.width * 4,
                    space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        }
        return Int(pixels[(y * image.width + image.width / 2) * 4])
    }

}

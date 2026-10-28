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
}

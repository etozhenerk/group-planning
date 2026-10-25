import Foundation
import ImageIO
import Testing
import UniformTypeIdentifiers

@testable import Somewhere

enum CoverFixtures {
    static func jpeg(width: Int = 3, height: Int = 2, orientation: Int = 1) throws -> Data {
        let context = try #require(
            CGContext(
                data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue))
        context.setFillColor(CGColor(red: 0.7, green: 0.2, blue: 0.1, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
        let image = try #require(context.makeImage())
        let data = NSMutableData()
        let destination = try #require(
            CGImageDestinationCreateWithData(data, UTType.jpeg.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(
            destination, image, [kCGImagePropertyOrientation: orientation] as CFDictionary)
        #expect(CGImageDestinationFinalize(destination))
        return data as Data
    }

    static func file(_ data: Data) throws -> URL {
        let file = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jpg")
        try data.write(to: file)
        return file
    }

    static func cover() throws -> PreparedCover {
        PreparedCover(mediaType: "image/jpeg", data: try jpeg())
    }
}

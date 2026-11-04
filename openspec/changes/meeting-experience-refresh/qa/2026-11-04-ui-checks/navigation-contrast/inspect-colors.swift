import Foundation
import AppKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let bitmap = NSBitmapImageRep(data: try Data(contentsOf: url)), let source = bitmap.cgImage else { fatalError("Missing screenshot") }
let scale = Double(source.width) / 402
var output: [String: Any] = [:]
for (name, x) in [("selected", 23.0), ("inactive", 141.6666666667)] {
    let rectangle = CGRect(x: x * scale, y: 773 * scale, width: 118.6666666667 * scale, height: 48 * scale)
    guard let crop = source.cropping(to: rectangle.integral) else { fatalError("Invalid crop") }
    var rgba = [UInt8](repeating: 0, count: crop.width * crop.height * 4)
    guard let context = CGContext(data: &rgba, width: crop.width, height: crop.height, bitsPerComponent: 8, bytesPerRow: crop.width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fatalError("No context") }
    context.draw(crop, in: CGRect(x: 0, y: 0, width: crop.width, height: crop.height))
    var counts: [String: Int] = [:]
    for index in stride(from: 0, to: rgba.count, by: 4) {
        let value = String(format: "#%02x%02x%02x", rgba[index], rgba[index + 1], rgba[index + 2])
        counts[value, default: 0] += 1
    }
    output[name] = counts.sorted { $0.value > $1.value }.prefix(20).map { ["color": $0.key, "pixels": $0.value] as [String: Any] }
}
let data = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys, .prettyPrinted])
try data.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))

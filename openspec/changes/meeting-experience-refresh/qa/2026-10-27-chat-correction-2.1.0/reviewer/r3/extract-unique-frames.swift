// Passive evidence utility: reads a recorded video; never controls the emulator.
import AVFoundation
import Foundation
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments
guard arguments.count >= 5,
      let start = Double(arguments[3]),
      let end = Double(arguments[4]) else {
    fatalError("Usage: extract-frames.swift video.mp4 output-folder start-seconds end-seconds [step-seconds]")
}
let step = arguments.count > 5 ? Double(arguments[5]) ?? (1.0 / 30.0) : (1.0 / 30.0)
let output = URL(fileURLWithPath: arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let asset = AVURLAsset(url: URL(fileURLWithPath: arguments[1]))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
var rows: [[String: Any]] = []
var seen = Set<Double>()
for (index, timestamp) in stride(from: start, through: end, by: step).enumerated() {
    var actual = CMTime.zero
    do {
        let frame = try generator.copyCGImage(at: CMTime(seconds: timestamp, preferredTimescale: 60000), actualTime: &actual)
        if seen.contains(actual.seconds) { continue }
        seen.insert(actual.seconds)
        let name = String(format: "frame-%05d.png", index)
        let file = output.appendingPathComponent(name)
        guard let destination = CGImageDestinationCreateWithURL(file as CFURL, UTType.png.identifier as CFString, 1, nil) else { continue }
        CGImageDestinationAddImage(destination, frame, nil)
        guard CGImageDestinationFinalize(destination) else { continue }
        rows.append(["file": name, "requestedSeconds": timestamp, "actualSeconds": actual.seconds, "width": frame.width, "height": frame.height])
    } catch {
        rows.append(["requestedSeconds": timestamp, "error": String(describing: error)])
    }
}
let data = try JSONSerialization.data(withJSONObject: rows, options: [.prettyPrinted, .sortedKeys])
try data.write(to: output.appendingPathComponent("frames.json"))
print("Extracted \(rows.count) timestamped frame records")

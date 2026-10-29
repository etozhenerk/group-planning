import Foundation
import AVFoundation
import AppKit

let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let target = URL(fileURLWithPath: args[2], isDirectory: true)
try FileManager.default.createDirectory(at: target, withIntermediateDirectories: true)
let start = Double(args[3])!
let end = Double(args[4])!
let step = Double(args[5])!
for time in stride(from: start, through: end, by: step) {
    let cg = try generator.copyCGImage(at: CMTime(seconds: time, preferredTimescale: 60000), actualTime: nil)
    let rep = NSBitmapImageRep(cgImage: cg)
    let name = String(format: "frame-%08.3f.png", time)
    try rep.representation(using: .png, properties: [:])!.write(to: target.appendingPathComponent(name))
}
print("Extracted", start, end, step)

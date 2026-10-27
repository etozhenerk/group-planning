import Foundation
import AVFoundation
import AppKit
let path = CommandLine.arguments[1]
let out = CommandLine.arguments[2]
let asset = AVURLAsset(url: URL(fileURLWithPath:path))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
try FileManager.default.createDirectory(atPath:out,withIntermediateDirectories:true)
let start = CommandLine.arguments.count > 3 ? Double(CommandLine.arguments[3]) ?? 0 : 0
let count = CommandLine.arguments.count > 4 ? Int(CommandLine.arguments[4]) ?? 160 : 160
for index in 0..<count {
 let time = CMTime(seconds: start + Double(index)/20.0, preferredTimescale:600)
 do {
  var actual = CMTime.zero
  let image = try generator.copyCGImage(at:time,actualTime:&actual)
  let data = NSBitmapImageRep(cgImage:image).representation(using:.png,properties:[:])!
  try data.write(to:URL(fileURLWithPath:out).appendingPathComponent(String(format:"%03d.png",index)))
 } catch { print("stop",index,error.localizedDescription); break }
}

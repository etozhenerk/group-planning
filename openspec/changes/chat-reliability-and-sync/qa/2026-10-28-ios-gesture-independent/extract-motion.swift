import Foundation
import AVFoundation
import AppKit
let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let columns=10, count=100, w=201, h=457
let sheet=NSImage(size:NSSize(width:w*columns,height:h*(count/columns)))
sheet.lockFocus()
NSColor.darkGray.setFill();NSRect(x:0,y:0,width:w*columns,height:h*(count/columns)).fill()
var samples:[[String:Any]]=[]
for index in 0..<count {
 let second=25.9+Double(index)*0.05
 var actual=CMTime.zero
 let cg=try generator.copyCGImage(at:CMTime(seconds:second,preferredTimescale:600),actualTime:&actual)
 let img=NSImage(cgImage:cg,size:NSSize(width:cg.width,height:cg.height))
 let x=index%columns*w, y=(count/columns-1-index/columns)*h
 img.draw(in:NSRect(x:x,y:y+20,width:w,height:h-20))
 NSString(string:String(format:"%.2fs",second)).draw(at:NSPoint(x:x+4,y:y+3),withAttributes:[.foregroundColor:NSColor.white,.font:NSFont.systemFont(ofSize:12)])
 samples.append(["requestedSeconds":second,"actualSeconds":actual.seconds])
}
sheet.unlockFocus()
let data=NSBitmapImageRep(data:sheet.tiffRepresentation!)!.representation(using:.png,properties:[:])!
try data.write(to:output.appendingPathComponent("motion-contact.png"))
try JSONSerialization.data(withJSONObject:samples,options:[.prettyPrinted,.sortedKeys]).write(to:output.appendingPathComponent("motion-samples.json"))
let exporter=AVAssetExportSession(asset:asset,presetName:AVAssetExportPreset640x480)!
exporter.outputURL=output.appendingPathComponent("motion-quick-full-close.mp4");exporter.outputFileType = .mp4
exporter.timeRange=CMTimeRange(start:CMTime(seconds:25.9,preferredTimescale:600),duration:CMTime(seconds:5,preferredTimescale:600))
let done=DispatchSemaphore(value:0);exporter.exportAsynchronously{done.signal()};done.wait()
print("export",exporter.status.rawValue,"duration",asset.duration.seconds)

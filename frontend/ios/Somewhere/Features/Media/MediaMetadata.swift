import Foundation
import UniformTypeIdentifiers

enum MediaMetadata {
    static func label(type: String, bytes: Int) -> String {
        let format = UTType(mimeType: type)?.preferredFilenameExtension?.uppercased() ?? "Файл"
        let size = ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)
        return format + " · " + size
    }
}

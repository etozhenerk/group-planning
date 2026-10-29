import Foundation

enum AlbumSaveFailure: Error, Equatable, Sendable {
    case busy
    case empty
    case invalidSnapshot
    case permissionRequired
    case storage
    case photoLibrary
    case cleanup(savedCount: Int)
}

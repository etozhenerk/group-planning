import Foundation

enum CoverDraft: Codable, Equatable, Sendable {
    case image(PreparedCover)
    case removed

    var image: PreparedCover? {
        if case .image(let value) = self { return value }
        return nil
    }
}

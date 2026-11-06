import Foundation

enum HomeDestination: Hashable {
    case meeting(UUID, publicToken: String? = nil)
    case declined(String)
}

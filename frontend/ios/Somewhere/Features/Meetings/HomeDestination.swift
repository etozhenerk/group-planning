import Foundation

enum HomeDestination: Hashable {
    case meeting(UUID)
    case declined(String)
}

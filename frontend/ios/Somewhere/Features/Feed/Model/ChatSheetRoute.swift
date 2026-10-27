import Foundation

enum ChatSheetRoute: Hashable {
    case information
    case share
    case settings
    case date
    case place
    case preparation
    case media
    case task(UUID)
    case people(UUID)
    case readers(UUID)
}

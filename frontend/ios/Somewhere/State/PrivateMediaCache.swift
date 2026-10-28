import Foundation
import UIKit

/// Session-only original bytes and a separate bounded display variant; both follow the access lease.
@MainActor
final class PrivateMediaCache {
    struct Item {
        let meeting: UUID
        let data: Data
        let image: UIImage?
    }
    private enum Variant: Hashable { case original, display }
    private struct Key: Hashable {
        let media: UUID
        let variant: Variant
    }
    private struct Entry {
        let meeting: UUID
        var data: Data?
        var image: UIImage?
        var cost: Int {
            (data?.count ?? 0) + (image?.cgImage.map { $0.bytesPerRow * $0.height } ?? 0)
        }
    }
    private var entries: [Key: Entry] = [:]
    private var order: [UUID] = []
    // Four prefetched photos: up to 10 MiB original + 16 MiB decoded display each.
    private let maximumBytes = 128 * 1024 * 1024

    func displaySize(_ id: UUID) -> CGSize? {
        entries[Key(media: id, variant: .display)]?.image?.size
    }

    func value(_ id: UUID) -> Item? {
        guard let original = entries[Key(media: id, variant: .original)], let data = original.data
        else {
            return nil
        }
        order.removeAll { $0 == id }
        order.append(id)
        return Item(
            meeting: original.meeting, data: data,
            image: entries[Key(media: id, variant: .display)]?.image)
    }

    func store(_ item: Item, id: UUID) {
        let original = Entry(meeting: item.meeting, data: item.data)
        let display = Entry(meeting: item.meeting, image: item.image)
        guard original.cost + display.cost <= maximumBytes else { return }
        entries[Key(media: id, variant: .original)] = original
        entries[Key(media: id, variant: .display)] = display
        order.removeAll { $0 == id }
        order.append(id)
        while entries.values.reduce(0, { $0 + $1.cost }) > maximumBytes, let first = order.first {
            order.removeFirst()
            entries.removeValue(forKey: Key(media: first, variant: .original))
            entries.removeValue(forKey: Key(media: first, variant: .display))
        }
    }

    func revoke(_ meeting: UUID) {
        entries = entries.filter { $0.value.meeting != meeting }
        order.removeAll { entries[Key(media: $0, variant: .original)] == nil }
    }

    func clear() {
        entries = [:]
        order = []
    }
}

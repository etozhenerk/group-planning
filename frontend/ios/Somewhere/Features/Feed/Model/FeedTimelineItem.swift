import Foundation

struct FeedTimelineItem: Identifiable {
    enum Key: Hashable {
        case intent(UUID, UUID)
        case entry(UUID)
    }
    let id: Key
    let entry: FeedEntry?
    let outgoing: OutgoingMessage?
    var date: Date { entry?.occurredAt.date ?? outgoing?.createdAt ?? .distantPast }
}

extension FeedOwner {
    var timeline: [FeedTimelineItem] {
        guard let user = session.profile?.id, current else { return [] }
        var rows = entries.map { entry in
            let matching = entry.clientRequestID.flatMap { key in pending.first { $0.id == key } }
            let validIntent = matching.map { $0.matches(entry, actor: user, meeting: id) } ?? true
            let key: FeedTimelineItem.Key =
                entry.actor.id == user && validIntent
                ? entry.clientRequestID.map { .intent(user, $0) } ?? .entry(entry.id)
                : .entry(entry.id)
            return FeedTimelineItem(id: key, entry: entry, outgoing: nil)
        }
        let keys = Set(rows.map(\.id))
        rows += pending.filter { !keys.contains(.intent(user, $0.id)) }.map {
            FeedTimelineItem(id: .intent(user, $0.id), entry: nil, outgoing: $0)
        }
        return rows
    }
}

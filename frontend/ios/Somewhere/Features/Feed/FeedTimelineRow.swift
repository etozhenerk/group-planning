import SwiftUI

struct FeedTimelineRow: View {
    let item: FeedTimelineItem
    let previousDate: Date?
    let owner: FeedOwner
    var body: some View {
        VStack(spacing: DesignTokens.spaceS20) {
            if previousDate == nil
                || !Calendar.current.isDate(item.date, inSameDayAs: previousDate ?? item.date)
            {
                Text(FeedPresentation.date(item.date)).font(
                    .system(size: DesignTokens.typographySizeLabel)
                )
                .foregroundStyle(AppPalette.muted).frame(minHeight: 16.5).padding(.vertical, 4)
            }
            if let entry = item.entry {
                if owner.reads.divider == entry.id { ChatUnreadDivider() }
                record(entry).id(entry.id).background {
                    GeometryReader { row in
                        Color.clear.preference(
                            key: FeedRowFrames.self,
                            value: [entry.id: row.frame(in: .named("timeline"))])
                    }
                }
            } else if let outgoing = item.outgoing {
                OutgoingMessageView(value: outgoing, owner: owner)
            }
        }
    }

    @ViewBuilder private func record(_ entry: FeedEntry) -> some View {
        let own = entry.actor.id == owner.session.profile?.id
        if entry.kind == "preparation_task_created", entry.payloadVersion == 1,
            case .string(let raw) = entry.payload["task_id"], let id = UUID(uuidString: raw)
        {
            PreparationTaskCard(
                taskID: id, entry: entry, own: own, session: owner.session,
                openDetails: { taskOwner in
                    owner.selectedTask = taskOwner
                    owner.openSheet(.task(id))
                })
        } else if entry.kind == "date_poll_created", entry.payloadVersion == 1,
            case .string(let raw) = entry.payload["poll_id"], let id = UUID(uuidString: raw),
            let meeting = owner.meeting
        {
            DatePollCard(
                pollID: id, meeting: meeting, entry: entry, own: own, session: owner.session)
        } else if entry.kind == "place_poll_created", entry.payloadVersion == 1,
            case .string(let raw) = entry.payload["poll_id"], let id = UUID(uuidString: raw),
            let meeting = owner.meeting
        {
            PlacePollCard(
                pollID: id, meeting: meeting, entry: entry, own: own, session: owner.session)
        } else if entry.kind == "message", entry.payloadVersion == 1 {
            MessageWithActions(entry: entry, owner: owner, own: own)
        } else {
            FeedRecordView(entry: entry, own: own)
        }
    }
}

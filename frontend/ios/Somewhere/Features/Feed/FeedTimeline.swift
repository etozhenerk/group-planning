import SwiftUI

struct FeedTimeline: View {
    let owner: FeedOwner
    @State private var visibleFrames: [UUID: CGRect] = [:]
    @State private var historyAnchor: FeedScrollAnchor?
    @State private var followsLatest = true
    @State private var started = false
    @State private var hasUnread = false
    var body: some View {
        let entries = owner.entries
        GeometryReader { geometry in
            ScrollViewReader { proxy in
                ScrollView(.vertical) {
                    LazyVStack(spacing: 20) {
                        if owner.hasHistory {
                            Button(owner.loadingHistory ? "Загружаем…" : "Предыдущие сообщения") {
                                historyAnchor =
                                    visibleFrames
                                    .filter {
                                        $0.value.minY >= 0 && $0.value.minY < geometry.size.height
                                    }
                                    .min { $0.value.minY < $1.value.minY }
                                    .map { FeedScrollAnchor(id: $0.key, frame: $0.value) }
                                owner.loadHistory()
                            }.disabled(owner.loadingHistory).frame(minHeight: 44)
                                .accessibilityIdentifier("feed-history")
                        }
                        if let problem = owner.historyProblem {
                            Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                        }
                        ForEach(Array(entries.enumerated()), id: \.element.id) {
                            index, entry in
                            VStack(spacing: 14) {
                                if index == 0
                                    || !Calendar.current.isDate(
                                        entry.occurredAt.date,
                                        inSameDayAs: entries[index - 1].occurredAt.date)
                                {
                                    Text(FeedPresentation.date(entry.occurredAt.date))
                                        .font(.caption.weight(.medium)).foregroundStyle(
                                            AppPalette.muted
                                        )
                                        .padding(.top, 12)
                                }
                                Group {
                                    if entry.kind == "date_poll_created", entry.payloadVersion == 1,
                                        case .string(let rawID) = entry.payload["poll_id"],
                                        let pollID = UUID(uuidString: rawID),
                                        let meeting = owner.meeting
                                    {
                                        DatePollCard(
                                            pollID: pollID, meeting: meeting, entry: entry,
                                            own: entry.actor.id == owner.session.profile?.id,
                                            session: owner.session)
                                    } else {
                                        FeedRecordView(
                                            entry: entry,
                                            own: entry.actor.id == owner.session.profile?.id)
                                    }
                                }
                                .id(entry.id)
                                .background {
                                    GeometryReader { row in
                                        Color.clear.preference(
                                            key: FeedRowFrames.self,
                                            value: [entry.id: row.frame(in: .named("timeline"))])
                                    }
                                }
                            }
                        }
                        ForEach(owner.pending) { value in
                            OutgoingMessageView(value: value, owner: owner).id(value.id)
                        }
                        Color.clear.frame(height: 1).id("latest")
                            .background(
                                GeometryReader { marker in
                                    Color.clear.preference(
                                        key: FeedBottomPreference.self,
                                        value: marker.frame(in: .named("timeline")).maxY)
                                })
                    }.padding(.horizontal, 14).padding(.bottom, 12)
                }.coordinateSpace(name: "timeline").defaultScrollAnchor(.bottom)
                    .scrollDismissesKeyboard(.interactively).accessibilityIdentifier(
                        "feed-timeline"
                    )
                    .onPreferenceChange(FeedRowFrames.self) { visibleFrames = $0 }
                    .onChange(of: owner.entries.first?.id) { old, new in
                        guard old != new, let anchor = historyAnchor else { return }
                        historyAnchor = nil
                        Task {
                            await Task.yield()
                            let space = geometry.size.height - anchor.frame.height
                            let alignment = space > 0 ? anchor.frame.minY / space : 0
                            proxy.scrollTo(anchor.id, anchor: UnitPoint(x: 0.5, y: alignment))
                        }
                    }
                    .onPreferenceChange(FeedBottomPreference.self) { bottom in
                        followsLatest = bottom <= geometry.size.height + 32 && bottom >= 0
                        if followsLatest { hasUnread = false }
                    }
                    .onChange(of: owner.entries.last?.id, initial: true) { _, _ in
                        if followsLatest || !started {
                            started = true
                            Task {
                                await Task.yield()
                                proxy.scrollTo("latest", anchor: .bottom)
                            }
                        } else {
                            hasUnread = true
                        }
                    }
                    .onChange(of: owner.pending.count) { old, new in
                        if new > old {
                            Task {
                                await Task.yield()
                                proxy.scrollTo("latest", anchor: .bottom)
                            }
                        }
                    }
                    .onChange(of: geometry.size.height) { _, _ in
                        if followsLatest { proxy.scrollTo("latest", anchor: .bottom) }
                    }
                    .overlay(alignment: .bottomTrailing) {
                        if hasUnread {
                            Button {
                                proxy.scrollTo("latest", anchor: .bottom)
                                hasUnread = false
                            } label: {
                                Label("К новым сообщениям", systemImage: "arrow.down").font(
                                    .caption.bold()
                                )
                                .padding(12).background(AppPalette.surface, in: Capsule())
                            }.padding(12).accessibilityIdentifier("feed-new-messages")
                        }
                    }
            }
        }
    }
}

private struct FeedBottomPreference: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

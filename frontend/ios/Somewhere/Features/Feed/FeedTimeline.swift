import SwiftUI

struct FeedTimeline: View {
    let owner: FeedOwner
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var viewportCache = FeedViewportCache()
    @State private var historyAnchor: FeedScrollAnchor?
    @State private var followsLatest: Bool
    @State private var userScrolling = false
    @State private var started = false
    @State private var hasUnread = false
    @State private var newMessageButtonHeight = DesignTokens.spaceS0
    init(owner: FeedOwner) {
        self.owner = owner
        _followsLatest = State(initialValue: owner.anchorID == nil && owner.reads.divider == nil)
    }
    private var pickingReaction: Bool {
        if case .reaction = owner.panel { return true }
        return false
    }
    var body: some View {
        let entries = owner.entries
        let timeline = owner.timeline
        GeometryReader { geometry in
            ScrollViewReader { proxy in
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        LazyVStack(spacing: 20) {
                            if owner.loadingHistory {
                                ChatConversationSkeleton(count: 2)
                            } else if owner.hasHistory && owner.historyProblem == nil {
                                Button(owner.loadingHistory ? "Загружаем…" : "Предыдущие сообщения")
                                {
                                    historyAnchor =
                                        viewportCache.frames
                                        .filter {
                                            $0.value.minY >= 0
                                                && $0.value.minY < geometry.size.height
                                        }
                                        .min { $0.value.minY < $1.value.minY }
                                        .map { FeedScrollAnchor(id: $0.key, frame: $0.value) }
                                    owner.loadHistory()
                                }.disabled(owner.loadingHistory).frame(minHeight: 44)
                                    .accessibilityIdentifier("feed-history")
                            }
                            if let problem = owner.historyProblem {
                                Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                                Button("Повторить", action: owner.loadHistory)
                                    .frame(minHeight: DesignTokens.targetIos)
                            }
                            ForEach(Array(timeline.enumerated()), id: \.element.id) {
                                index, item in
                                FeedTimelineRow(
                                    item: item,
                                    previousDate: index == 0 ? nil : timeline[index - 1].date,
                                    owner: owner)
                            }
                            if !entries.contains(where: { $0.kind == "message" }),
                                owner.invitation.organizer,
                                let url = owner.invitation.shareURL
                            {
                                VStack(spacing: 12) {
                                    Text("Позовём остальных?").font(.headline)
                                    ShareLink("Пригласить друзей", item: url).frame(minHeight: 44)
                                }.padding(24)
                            }

                        }
                        if owner.loadingNewer { ChatConversationSkeleton(count: 2) }
                        if let problem = owner.newerProblem {
                            Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                            Button("Повторить", action: owner.loadNewer).frame(
                                minHeight: DesignTokens.targetIos)
                        }
                        Spacer(minLength: 0)
                        if hasUnread || owner.hasNewer {
                            Color.clear.frame(height: newMessageButtonHeight)
                        }
                        Color.clear.frame(height: 1).id("latest")
                            .background(
                                GeometryReader { marker in
                                    Color.clear.preference(
                                        key: FeedBottomPreference.self,
                                        value: marker.frame(in: .named("timeline")).maxY)
                                })
                    }.frame(minHeight: max(0, geometry.size.height - 36), alignment: .top)
                        .padding(.horizontal, 16).padding(.vertical, 18)
                }.coordinateSpace(name: "timeline").defaultScrollAnchor(.bottom)
                    .modifier(FeedScrollActivity(isScrolling: $userScrolling))
                    .scrollDisabled(pickingReaction)
                    .scrollDismissesKeyboard(.interactively).accessibilityIdentifier(
                        "feed-timeline"
                    )
                    .overlayPreferenceValue(ReactionAnchorPreference.self) { anchors in
                        GeometryReader { overlay in
                            if case .reaction(let id) = owner.panel,
                                let entry = owner.entries.first(where: { $0.id == id }),
                                let anchor = anchors[id]
                            {
                                ZStack {
                                    Color.clear.contentShape(Rectangle()).onTapGesture {
                                        SystemKeyboard.dismiss()
                                        owner.closeReactions()
                                    }
                                    ReactionPickerOverlay(
                                        owner: owner, entry: entry, frame: overlay[anchor],
                                        size: geometry.size)
                                }
                            }
                        }
                        .animation(
                            ChatMotion.animation(
                                owner.panel == nil
                                    ? DesignTokens.motionDurationReactionExit
                                    : DesignTokens.motionDurationReactionEnter,
                                reduceMotion: reduceMotion), value: owner.panel)
                    }
                    .simultaneousGesture(
                        TapGesture().onEnded {
                            if owner.panel == .actions { owner.panel = nil }
                        }
                    )
                    .onPreferenceChange(FeedRowFrames.self) { frames in
                        viewportCache.frames = frames
                        let visible = Set(
                            frames.filter {
                                $0.value.maxY > 0 && $0.value.minY < geometry.size.height
                            }.map(\.key))
                        let top = frames.filter {
                            $0.value.maxY > 0 && $0.value.minY < geometry.size.height
                        }
                        .min { $0.value.minY < $1.value.minY }
                        if owner.loadingHistory, let top {
                            // The user can keep scrolling while a page is in flight.
                            // Restore the current viewport, not the request's old position.
                            historyAnchor = FeedScrollAnchor(id: top.key, frame: top.value)
                        }
                        owner.anchorID = followsLatest ? nil : top?.key
                        if let top, !followsLatest {
                            owner.session.privateData.chatAnchors[owner.id] = FeedScrollAnchor(
                                id: top.key, frame: top.value)
                        } else if followsLatest {
                            owner.session.privateData.chatAnchors.removeValue(forKey: owner.id)
                        }
                        owner.reads.visible(
                            entries.filter { entry in
                                guard entry.kind == "message", let frame = frames[entry.id] else {
                                    return false
                                }
                                return frame.maxY > 0 && frame.maxY <= geometry.size.height
                            }, unobscured: owner.sheets.isEmpty && owner.panel == nil)
                        if !owner.loadingHistory, owner.historyProblem == nil, owner.hasHistory,
                            let first = entries.first,
                            let frame = frames[first.id], frame.maxY >= -geometry.size.height * 2
                        {
                            historyAnchor = top.map {
                                FeedScrollAnchor(id: $0.key, frame: $0.value)
                            }
                            owner.loadHistory()
                        }
                        if owner.hasNewer, owner.newerProblem == nil, let last = entries.last,
                            let frame = frames[last.id],
                            frame.minY <= geometry.size.height * 3
                        {
                            owner.loadNewer()
                        }
                        guard viewportCache.visibleIDs != visible else { return }
                        viewportCache.visibleIDs = visible
                        owner.reactions.updateVisible(
                            entries.filter {
                                $0.kind == "message" && visible.contains($0.id)
                            }.map(\.id))
                    }
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
                    .onPreferenceChange(FeedBottomPreference.self) { value in
                        guard let bottom = value else { return }
                        let nearBottom = bottom <= geometry.size.height + 64 && bottom >= 0
                        if userScrolling || !followsLatest {
                            if followsLatest != nearBottom { followsLatest = nearBottom }
                        } else if bottom > geometry.size.height + 64 {
                            Task { @MainActor in
                                await Task.yield()
                                guard followsLatest, !userScrolling else { return }
                                proxy.scrollTo("latest", anchor: .bottom)
                            }
                        }
                        owner.followingLatest = followsLatest && !owner.hasNewer
                        if nearBottom && hasUnread { hasUnread = false }
                        if nearBottom && !owner.hasNewer { owner.newMessageCount = 0 }
                    }
                    .onChange(of: owner.entries.last?.id, initial: true) { _, _ in
                        if followsLatest || !started {
                            let firstOpening = !started
                            started = true
                            Task {
                                await Task.yield()
                                if firstOpening,
                                    let anchor = owner.session.privateData.chatAnchors[owner.id],
                                    owner.entries.contains(where: { $0.id == anchor.id })
                                {
                                    let space = geometry.size.height - anchor.frame.height
                                    proxy.scrollTo(
                                        anchor.id,
                                        anchor: UnitPoint(
                                            x: 0.5, y: space > 0 ? anchor.frame.minY / space : 0))
                                } else if firstOpening, let unread = owner.reads.divider {
                                    proxy.scrollTo(unread, anchor: .top)
                                } else {
                                    proxy.scrollTo("latest", anchor: .bottom)
                                }
                            }
                        } else {
                            hasUnread = true
                        }
                    }
                    .onChange(of: owner.mediaPresented) { old, presented in
                        if old && !presented && !owner.media.entries.isEmpty {
                            Task {
                                await Task.yield()
                                owner.jumpToLatest()
                                followsLatest = true
                                proxy.scrollTo("latest", anchor: .bottom)
                                hasUnread = false
                            }
                        }
                    }
                    .onChange(of: owner.pending.count) { old, new in
                        if new > old && followsLatest {
                            Task {
                                await Task.yield()
                                proxy.scrollTo("latest", anchor: .bottom)
                            }
                        } else if new > old {
                            hasUnread = true
                        }
                    }
                    .onChange(of: geometry.size.height) { _, _ in
                        if followsLatest { proxy.scrollTo("latest", anchor: .bottom) }
                    }
                    .overlay(alignment: .bottomTrailing) {
                        if hasUnread || owner.hasNewer {
                            Button {
                                owner.jumpToLatest()
                                followsLatest = true
                                proxy.scrollTo("latest", anchor: .bottom)
                                hasUnread = false
                            } label: {
                                Label(
                                    owner.newMessageCount > 0
                                        ? ChatReadCopy.newMessages(owner.newMessageCount)
                                        : "К новым сообщениям", systemImage: "arrow.down"
                                ).font(
                                    .caption.bold()
                                )
                                .padding(12).background(AppPalette.surface, in: Capsule())
                            }.padding(12).accessibilityIdentifier("feed-new-messages")
                                .onGeometryChange(for: CGFloat.self) {
                                    $0.size.height
                                } action: {
                                    newMessageButtonHeight = $0
                                }
                        }
                    }
            }
        }
    }
}

private struct FeedBottomPreference: PreferenceKey {
    static let defaultValue: CGFloat? = nil
    static func reduce(value: inout CGFloat?, nextValue: () -> CGFloat?) {
        if let next = nextValue() { value = next }
    }
}

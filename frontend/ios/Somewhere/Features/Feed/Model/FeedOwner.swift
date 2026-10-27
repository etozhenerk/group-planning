import Foundation
import Observation

@MainActor @Observable
final class FeedOwner {
    let id: UUID
    let session: SessionStore
    let invitation: InvitationOwner
    let media: MediaTransferOwner
    let memories: MemoriesOwner
    let reads: ChatReadOwner
    var readers: ChatReadersOwner?
    let reactions: ReactionOwner
    let actionDrafts: MeetingActionDrafts
    var panel: ConversationPanel? { didSet { reads.cover(panel != nil || !sheets.isEmpty) } }
    var sheets: [ChatSheetRoute] = [] { didSet { reads.cover(panel != nil || !sheets.isEmpty) } }
    var selectedTask: PreparationTaskOwner?
    var reactionExpanded = false
    var returnedMessage: UUID?
    var returnedToPeople = false
    var reactionPeopleFilter: String?
    var composerSelection = NSRange(location: 0, length: 0)
    var informationExpanded = false
    var informationReturn: ChatSheetRoute?
    var informationScrollOffset: CGFloat = 0
    var mediaPresented: Bool { sheets.contains(.media) }
    var photoSelection = false
    let lease: PrivateData.Lease?
    var records: [FeedEntry] = []
    var outgoing: [OutgoingMessage] = []
    var draft = "" {
        didSet {
            if oldValue != draft {
                draftRevision += 1
                persistDraft()
            }
        }
    }
    var saving = false
    var storageProblem: String?
    var composerFocused = false
    var loading = false
    var loadingHistory = false
    var loaded = false
    var hasHistory = false
    var problem: String?
    var historyProblem: String?
    var infoPresented: Bool { sheets.contains(.information) }
    var cursor: ServerCounter?
    @ObservationIgnored var generation = UUID()
    @ObservationIgnored var historyTask: Task<Void, Never>?
    @ObservationIgnored var refreshTask: Task<Void, Never>?
    @ObservationIgnored var queueTask: Task<Void, Never>?
    @ObservationIgnored var retryTask: Task<Void, Never>?
    @ObservationIgnored var retryDelay: Double = 3
    @ObservationIgnored var transmitting: UUID?
    @ObservationIgnored var localLease: ChatRepository.Lease?
    @ObservationIgnored var localLoad: Task<Void, any Error>?
    @ObservationIgnored var draftTask: Task<Void, Never>?
    @ObservationIgnored var draftRevision = 0
    @ObservationIgnored var realtime: any ChatRealtimeTransport
    @ObservationIgnored var fallbackTask: Task<Void, Never>?
    @ObservationIgnored var hintTask: Task<Void, Never>?
    var capabilities: ChatCapabilities?
    var changeCursor: String?
    var streamEpoch: UUID?
    var projectionVersions: [UUID: ServerCounter] = [:]
    var latestKnownSequence: ServerCounter = .zero
    var followingLatest = true
    var newMessageCount = 0
    var hasNewer = false
    var loadingNewer = false
    var newerProblem: String?
    var anchorID: UUID?
    var capabilitiesLoaded = false
    var transportStarted = false
    var subscriptionReady = false
    var realtimeReady = false
    var active = false
    var syncRequested = false

    init(
        id: UUID, session: SessionStore, invitation: InvitationOwner,
        realtime: (any ChatRealtimeTransport)? = nil
    ) {
        self.realtime = realtime ?? session.realtimeFactory()
        self.id = id
        self.session = session
        self.invitation = invitation
        media = MediaTransferOwner(id: id, session: session, purpose: "message")
        memories = MemoriesOwner(id: id, session: session)
        reads = ChatReadOwner(meetingID: id, session: session)
        anchorID = session.privateData.chatAnchors[id]?.id
        reactions = ReactionOwner(id: id, session: session)
        actionDrafts = MeetingActionDrafts(meetingID: id, session: session)
        lease = try? session.privateData.lease(for: id)
    }

    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    var entries: [FeedEntry] { current ? records : [] }
    var pending: [OutgoingMessage] { current ? outgoing : [] }
    var meeting: Meeting? { current ? session.privateData.details[id]?.value : nil }
    var canSend: Bool {
        current && loaded && !saving
            && !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && draft.unicodeScalars.count <= 4000
    }

    func suspend() {
        active = false
        reads.pause()
        readers?.suspend()
        localLease = nil
        localLoad?.cancel()
        localLoad = nil
        realtime.disconnect()
        realtimeReady = false
        subscriptionReady = false
        transportStarted = false
        fallbackTask?.cancel()
        fallbackTask = nil
        hintTask?.cancel()
        hintTask = nil
        retryTask?.cancel()
        retryTask = nil
        queueTask?.cancel()
        queueTask = nil
        transmitting = nil
        saving = false
        media.suspend()
        memories.transfer.suspend()
        reactions.suspend()
        generation = UUID()
        loading = false
        loadingHistory = false
        loadingNewer = false
        historyTask?.cancel()
        refreshTask?.cancel()
        historyTask = nil
        refreshTask = nil

        for index in outgoing.indices where outgoing[index].status == .sending {
            outgoing[index].status = .uncertain
        }
    }

    func clear() {
        actionDrafts.clear()
        panel = nil
        suspend()
        localLease = nil
        records.removeAll()
        outgoing.removeAll()
        draft = ""
        sheets = []
        selectedTask = nil
        composerSelection = NSRange(location: 0, length: 0)
        composerFocused = false
        informationExpanded = false
        informationReturn = nil
        informationScrollOffset = 0
        returnedMessage = nil
        returnedToPeople = false
        reactionPeopleFilter = nil
        memories.clear()
    }

    func openSheet(_ route: ChatSheetRoute, child: Bool = false) {
        panel = nil
        composerFocused = false
        if child { sheets.append(route) } else { sheets = [route] }
    }

    func closeSheet() {
        guard let closed = sheets.popLast() else { return }
        if case .people(let id) = closed {
            returnedToPeople = true
            returnedMessage = id
        }
        if case .readers(let id) = closed {
            returnedToPeople = false
            returnedMessage = id
            readers?.suspend()
            readers = nil
        }
        if sheets.last == .information { informationReturn = closed }
        reload()
    }

    func openReactions(_ id: UUID) {
        composerFocused = false
        reactionExpanded = false
        returnedMessage = nil
        panel = .reaction(id)
    }

    func openReactionPeople(_ id: UUID, emoji: String) {
        returnedMessage = nil
        reactionPeopleFilter = emoji
        openSheet(.people(id))
    }

    func openReaders(_ entry: FeedEntry) {
        guard reads.enabled, current, entry.actor.id == session.profile?.id else { return }
        readers = ChatReadersOwner(meetingID: id, entryID: entry.id, session: session)
        openSheet(.readers(entry.id))
    }

    func closeReactions() {
        if case .reaction(let id) = panel {
            returnedToPeople = false
            returnedMessage = id
        }
        panel = nil
        reactionExpanded = false
    }

    func merge(_ entries: [FeedEntry]) throws {
        guard !entries.isEmpty else { return }
        try validateEntries(entries)
        var unique = Dictionary(records.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        for entry in entries { unique[entry.id] = entry }
        let merged = unique.values.sorted { $0.sequence < $1.sequence }
        if records != merged { records = merged }
        let valid = Set(
            outgoing.filter { pending in
                entries.contains {
                    pending.matches($0, actor: session.profile?.id, meeting: id)
                }
            }.map(\.id))
        outgoing.removeAll { valid.contains($0.id) }
        acknowledge(valid)
    }

    func validateEntries(_ entries: [FeedEntry]) throws {
        guard
            entries.allSatisfy({ entry in
                guard entry.meetingID == id else { return false }
                guard entry.actor.id == session.profile?.id, let key = entry.clientRequestID,
                    let pending = outgoing.first(where: { $0.id == key })
                else { return true }
                return pending.matches(entry, actor: session.profile?.id, meeting: id)
            })
        else { throw ClientFailure.invalidResponse }
    }

    func failed(_ error: any Error, version: UUID) {
        guard generation == version else { return }
        if !current {
            clear()
        } else if (error as? ClientFailure)?.statusCode == 404 {
            session.updateMeetingAccess(id, allowed: false)
            invitation.problem = "Встреча недоступна"
            clear()
        } else if !(error is CancellationError) {
            problem = "Не удалось обновить разговор."
        }
    }
}

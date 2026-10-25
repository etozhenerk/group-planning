import Foundation
import Observation

@MainActor @Observable
final class FeedOwner {
    let id: UUID
    let session: SessionStore
    let invitation: InvitationOwner
    let media: MediaTransferOwner
    let memories: MemoriesOwner
    let reactions: ReactionOwner
    let actionDrafts: MeetingActionDrafts
    var panel: ConversationPanel?
    var mediaPresented = false
    var photoSelection = false
    let lease: PrivateData.Lease?
    var records: [FeedEntry] = []
    var outgoing: [OutgoingMessage] = []
    var draft = ""
    var composerFocused = false
    var loading = false
    var loadingHistory = false
    var loaded = false
    var hasHistory = false
    var problem: String?
    var historyProblem: String?
    var infoPresented = false
    var pollPresented = false
    var placePollPresented = false
    var preparationTaskPresented = false
    var cursor: ServerCounter?
    @ObservationIgnored var generation = UUID()
    @ObservationIgnored var historyTask: Task<Void, Never>?
    @ObservationIgnored var refreshTask: Task<Void, Never>?
    @ObservationIgnored var sends: [UUID: Task<Void, Never>] = [:]

    init(id: UUID, session: SessionStore, invitation: InvitationOwner) {
        self.id = id
        self.session = session
        self.invitation = invitation
        media = MediaTransferOwner(id: id, session: session, purpose: "message")
        memories = MemoriesOwner(id: id, session: session)
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
        current && loaded && !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && draft.unicodeScalars.count <= 4000
    }

    func suspend() {
        media.suspend()
        memories.transfer.suspend()
        reactions.suspend()
        generation = UUID()
        loading = false
        loadingHistory = false
        historyTask?.cancel()
        refreshTask?.cancel()
        historyTask = nil
        refreshTask = nil
        for task in sends.values { task.cancel() }
        sends.removeAll()
        for index in outgoing.indices where outgoing[index].status == .sending {
            outgoing[index].status = .uncertain
        }
    }

    func clear() {
        actionDrafts.clear()
        panel = nil
        suspend()
        records.removeAll()
        outgoing.removeAll()
        draft = ""
        mediaPresented = false
        memories.clear()
        infoPresented = false
        pollPresented = false
        placePollPresented = false
        preparationTaskPresented = false
    }

    func merge(_ entries: [FeedEntry]) throws {
        guard entries.allSatisfy({ $0.meetingID == id }) else {
            throw ClientFailure.invalidResponse
        }
        var unique = Dictionary(records.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        for entry in entries { unique[entry.id] = entry }
        records = unique.values.sorted { $0.sequence < $1.sequence }
        let confirmed = Set(
            entries.filter { $0.actor.id == session.profile?.id }.compactMap(\.clientRequestID))
        outgoing.removeAll { confirmed.contains($0.id) }
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

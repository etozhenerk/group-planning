import Foundation
import Observation

@MainActor @Observable
final class ReactionOwner {
    let id: UUID
    let session: SessionStore
    private let lease: PrivateData.Lease?
    var values: [UUID: [MessageReaction]] = [:]
    var visible: [UUID] = []
    var failures: Set<UUID> = []
    var loading = false
    private var generation = UUID()
    private struct Intent {
        let emoji: String
        let active: Bool
        let key: UUID
    }
    private var revisions: [UUID: UUID] = [:]
    private var failedIntents: [UUID: Intent] = [:]
    private var activeIntents: [UUID: Intent] = [:]
    @ObservationIgnored private var visibilityTask: Task<Void, Never>?
    @ObservationIgnored private var mutations: [UUID: Task<Void, Never>] = [:]
    init(id: UUID, session: SessionStore) {
        self.id = id
        self.session = session
        lease = try? session.privateData.lease(for: id)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func isUpdating(_ entryID: UUID) -> Bool { activeIntents[entryID] != nil }
    func updateVisible(_ ids: [UUID]) {
        guard visible != ids else { return }
        visible = ids
        guard !loading else { return }
        visibilityTask = Task { await refresh() }
    }
    func refresh() async {
        guard current, !visible.isEmpty, !loading else { return }
        let version = generation
        loading = true
        defer { if generation == version { loading = false } }
        do {
            var requested: [UUID]
            repeat {
                requested = Array(visible.prefix(50))
                guard !requested.isEmpty else { return }
                var request = ExperienceRequests.meeting(id, ["reactions"])
                request.query = requested.map {
                    URLQueryItem(name: "entry_id", value: $0.uuidString.lowercased())
                }
                let startedRevisions = revisions
                let result = try await session.send(request, as: ReactionPage.self)
                try Task.checkCancellation()
                guard current, generation == version else { return }
                for entry in result.entries
                where mutations[entry.entryID] == nil
                    && revisions[entry.entryID] == startedRevisions[entry.entryID]
                    && values[entry.entryID] != entry.reactions
                {
                    values[entry.entryID] = entry.reactions
                }
            } while current && requested != Array(visible.prefix(50))
        } catch {
            // Keep confirmed reactions; the next active feed refresh retries the batch.
        }
    }
    func toggle(_ emoji: String, entryID: UUID) {
        let active = !(values[entryID]?.first(where: { $0.emoji == emoji })?.mine ?? false)
        perform(Intent(emoji: emoji, active: active, key: UUID()), entryID: entryID)
    }
    func retry(_ entryID: UUID) {
        guard let intent = failedIntents[entryID] else { return }
        perform(intent, entryID: entryID)
    }
    private func perform(_ intent: Intent, entryID: UUID) {
        guard current, mutations[entryID] == nil, let user = session.profile else { return }
        let previous = values[entryID] ?? []
        var optimistic = previous
        if let index = optimistic.firstIndex(where: { $0.emoji == intent.emoji }) {
            if optimistic[index].mine != intent.active {
                optimistic[index].count += intent.active ? 1 : -1
            }
            optimistic[index].mine = intent.active
            optimistic[index].users.removeAll { $0.id == user.id }
            if intent.active { optimistic[index].users.append(user) }
            optimistic.removeAll { $0.count <= 0 }
        } else if intent.active {
            optimistic.append(
                MessageReaction(emoji: intent.emoji, count: 1, mine: true, users: [user]))
        }
        values[entryID] = optimistic
        failures.remove(entryID)
        failedIntents.removeValue(forKey: entryID)
        activeIntents[entryID] = intent
        revisions[entryID] = UUID()
        let version = generation
        mutations[entryID] = Task {
            defer {
                if generation == version {
                    revisions[entryID] = UUID()
                    mutations.removeValue(forKey: entryID)
                    activeIntents.removeValue(forKey: entryID)
                }
            }
            do {
                struct Input: Encodable {
                    let emoji: String
                    let active: Bool
                }
                let request = try APIRequest.json(
                    path: ExperienceRequests.meeting(
                        id, ["messages", entryID.uuidString.lowercased(), "reactions"]
                    ).path,
                    method: .put, body: Input(emoji: intent.emoji, active: intent.active),
                    key: intent.key,
                    meetingID: id,
                    invalidatesMeetingOnForbidden: true)
                let result = try await session.send(request, as: MessageReactions.self)
                try Task.checkCancellation()
                guard current, generation == version else { return }
                guard result.entryID == entryID else { throw ClientFailure.invalidResponse }
                values[entryID] = result.reactions
            } catch {
                guard current, generation == version else { return }
                values[entryID] = previous
                failedIntents[entryID] = intent
                failures.insert(entryID)
            }
        }
    }
    func suspend() {
        generation = UUID()
        visibilityTask?.cancel()
        visibilityTask = nil
        for (entryID, intent) in activeIntents {
            revisions[entryID] = UUID()
            failedIntents[entryID] = intent
            failures.insert(entryID)
        }
        activeIntents = [:]
        for task in mutations.values { task.cancel() }
        mutations.removeAll()
        loading = false
        if !current {
            values = [:]
            failures = []
            visible = []
            failedIntents = [:]
            revisions = [:]
        }
    }
}

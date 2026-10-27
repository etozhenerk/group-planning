import Foundation

extension FeedOwner {
    func restoreLocal() async throws {
        if localLease != nil { return }
        if let localLoad {
            try await localLoad.value
            return
        }
        let version = generation
        let task = Task { @MainActor in
            let (lease, value) = try await session.chatContext(meeting: id)
            guard current, generation == version else { throw ClientFailure.staleSession }
            localLease = lease
            outgoing = value.outgoing
            if draft.isEmpty { draft = value.draft }
            persistDraft()
        }
        localLoad = task
        defer { if generation == version { localLoad = nil } }
        try await task.value
    }

    func persistDraft() {
        guard current, let lease = localLease else { return }
        let revision = draftRevision
        let value = draft
        let version = generation
        draftTask = Task {
            do { try await session.chat.draft(value, revision: revision, lease: lease) } catch {
                guard current, generation == version else { return }
                storageProblem = "Не удалось сохранить сообщение на устройстве"
            }
        }
    }

    func acknowledge(_ ids: Set<UUID>) {
        guard !ids.isEmpty, let lease = localLease else { return }
        let version = generation
        Task {
            do { try await session.chat.acknowledge(ids, lease: lease) } catch {
                guard current, generation == version else { return }
                storageProblem = "Не удалось сохранить сообщение на устройстве"
            }
        }
    }
}

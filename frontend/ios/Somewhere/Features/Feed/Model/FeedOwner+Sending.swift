import Foundation

extension FeedOwner {
    @discardableResult
    func enqueue() async -> UUID? {
        guard canSend else { return nil }
        saving = true
        let text = draft
        let draftVersion = draftRevision
        let version = generation
        defer { if generation == version { saving = false } }
        do {
            try await restoreLocal()
            guard current, generation == version, let lease = localLease else { return nil }
            let message = OutgoingMessage(
                id: UUID(), text: text, createdAt: Date(), status: .queued)
            try await session.chat.enqueue(message, draftRevision: draftVersion, lease: lease)
            guard current, generation == version else { return nil }
            outgoing.append(message)
            if draft == text { draft = "" }
            storageProblem = nil
            return message.id
        } catch {
            if current, generation == version {
                storageProblem = "Не удалось сохранить сообщение на устройстве"
            }
            return nil
        }
    }

    func sendDraft() {
        Task { if await enqueue() != nil { drainQueue() } }
    }

    func retry(_ key: UUID) {
        guard current, outgoing.contains(where: { $0.id == key }) else { return }
        let version = generation
        Task {
            if outgoing.first(where: { $0.id == key })?.status == .rejected {
                do {
                    try await restoreLocal()
                    guard current, generation == version, let lease = localLease else { return }
                    try await session.chat.status(.queued, id: key, lease: lease)
                    guard current, generation == version else { return }
                    setStatus(.queued, key: key)
                } catch {
                    if current, generation == version {
                        storageProblem = "Не удалось сохранить сообщение на устройстве"
                    }
                    return
                }
            }
            guard current, generation == version else { return }
            drainQueue()
        }
    }

    func drainQueue() {
        guard current, queueTask == nil else { return }
        let version = generation
        queueTask = Task {
            defer { if generation == version { queueTask = nil } }
            while current, generation == version, !Task.isCancelled,
                let first = outgoing.first(where: { $0.status != .rejected })
            {
                await transmit(first.id)
                guard !outgoing.contains(where: { $0.id == first.id && $0.status != .rejected })
                else { return }
            }
        }
    }

    func transmit(_ key: UUID) async {
        guard current, transmitting == nil,
            let message = outgoing.first(where: { $0.status != .rejected }), message.id == key
        else { return }
        let version = generation
        transmitting = key
        defer { if generation == version { transmitting = nil } }
        do {
            try await restoreLocal()
            guard current, generation == version, let lease = localLease else { return }
            try await session.chat.status(.sending, id: key, lease: lease)
            guard current, generation == version else { return }
            setStatus(.sending, key: key)
            let entry = try await session.send(
                FeedRequests.message(id, text: message.text, clientRequestID: key),
                as: FeedEntry.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard message.matches(entry, actor: session.profile?.id, meeting: id)
            else { throw ClientFailure.invalidResponse }
            try await session.chat.acknowledge([key], lease: lease)
            guard current, generation == version else { return }
            try merge([entry])
            retryDelay = 3
        } catch {
            guard generation == version else { return }
            guard current else {
                clear()
                return
            }
            let status: OutgoingMessage.Status =
                [400, 409, 422].contains(
                    (error as? ClientFailure)?.statusCode ?? 0) ? .rejected : .uncertain
            setStatus(status, key: key)
            if status == .uncertain { scheduleRetry() }
            if let lease = localLease {
                do { try await session.chat.status(status, id: key, lease: lease) } catch {
                    if current { storageProblem = "Не удалось сохранить сообщение на устройстве" }
                }
            }
        }
    }

    func restoreRejected(_ key: UUID) {
        guard current, draft.isEmpty, let lease = localLease,
            let message = outgoing.first(where: { $0.id == key && $0.status == .rejected })
        else { return }
        let version = generation
        let revision = draftRevision
        Task {
            do {
                guard
                    let text = try await session.chat.restore(
                        key, draftRevision: revision, lease: lease)
                else { return }
                guard current, generation == version else { return }
                if draft.isEmpty {
                    draft = text
                    outgoing.removeAll { $0.id == key }
                } else {
                    try await session.chat.retainRejected(message, lease: lease)
                    persistDraft()
                }
            } catch {
                if current, generation == version {
                    storageProblem = "Не удалось сохранить сообщение на устройстве"
                }
            }
        }
    }

    private func scheduleRetry() {
        guard active, retryTask == nil else { return }
        let version = generation
        let delay = retryDelay
        retryDelay = min(30, retryDelay * 2)
        retryTask = Task {
            do { try await Task.sleep(for: .seconds(delay)) } catch { return }
            guard current, active, generation == version else { return }
            retryTask = nil
            guard outgoing.contains(where: { $0.status == .uncertain }) else { return }
            await refresh()
            if current, generation == version { drainQueue() }
        }
    }

    private func setStatus(_ status: OutgoingMessage.Status, key: UUID) {
        if let index = outgoing.firstIndex(where: { $0.id == key }) {
            outgoing[index].status = status
        }
    }
}

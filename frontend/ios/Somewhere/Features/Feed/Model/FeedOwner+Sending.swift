import Foundation

extension FeedOwner {
    @discardableResult
    func enqueue() -> UUID? {
        guard canSend else { return nil }
        let message = OutgoingMessage(
            id: UUID(), text: draft, createdAt: Date(), status: .uncertain)
        outgoing.append(message)
        draft = ""
        return message.id
    }

    func sendDraft() {
        guard let key = enqueue() else { return }
        retry(key)
    }

    func retry(_ key: UUID) {
        guard current, sends[key] == nil else { return }
        sends[key] = Task { await transmit(key) }
    }

    func transmit(_ key: UUID) async {
        guard current, let index = outgoing.firstIndex(where: { $0.id == key }),
            outgoing[index].status == .uncertain
        else { return }
        let message = outgoing[index]
        let version = generation
        outgoing[index].status = .sending
        defer { if generation == version { sends.removeValue(forKey: key) } }
        do {
            let entry = try await session.send(
                FeedRequests.message(id, text: message.text, clientRequestID: key),
                as: FeedEntry.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard entry.clientRequestID == key, entry.actor.id == session.profile?.id,
                entry.messageText == message.text
            else { throw ClientFailure.invalidResponse }
            try merge([entry])
        } catch {
            guard generation == version else { return }
            if !current {
                clear()
                return
            }
            guard let index = outgoing.firstIndex(where: { $0.id == key }) else { return }
            let status = (error as? ClientFailure)?.statusCode
            outgoing[index].status = [400, 409, 422].contains(status ?? 0) ? .rejected : .uncertain
        }
    }

    func restoreRejected(_ key: UUID) {
        guard current, draft.isEmpty,
            let value = outgoing.first(where: { $0.id == key && $0.status == .rejected })
        else { return }
        draft = value.text
        outgoing.removeAll { $0.id == key }
    }
}

import Foundation

actor ChatRepository {
    struct Lease: Sendable, Equatable {
        let id: UUID
        let owner: UUID
        let meeting: UUID
        let generation: Int
    }
    private struct OpenRecord {
        let lease: Lease
        var value: ChatLocalRecord
        var draftRevision = 0
    }
    private let storage: any ChatPersistence
    private var generation = 0
    private var records: [UUID: OpenRecord] = [:]

    init(storage: any ChatPersistence) { self.storage = storage }

    func open(owner: UUID, meeting: UUID, generation: Int) throws -> (Lease, ChatLocalRecord) {
        guard generation >= self.generation else { throw ClientFailure.staleSession }
        self.generation = generation
        let lease = Lease(id: UUID(), owner: owner, meeting: meeting, generation: generation)
        var value =
            try storage.load(owner: owner, meeting: meeting)
            ?? ChatLocalRecord(ownerID: owner, meetingID: meeting)
        for index in value.outgoing.indices where value.outgoing[index].status == .sending {
            value.outgoing[index].status = .uncertain
        }
        records[meeting] = OpenRecord(lease: lease, value: value)
        return (lease, value)
    }

    func draft(_ draft: String, revision: Int, lease: Lease) throws {
        var record = try checked(lease)
        guard revision >= record.draftRevision else { return }
        record.value.draft = draft
        record.draftRevision = revision
        try commit(record)
    }

    func enqueue(_ message: OutgoingMessage, draftRevision: Int, lease: Lease) throws {
        var record = try checked(lease)
        guard !record.value.outgoing.contains(where: { $0.id == message.id }) else { return }
        record.value.outgoing.append(message)
        if record.draftRevision <= draftRevision {
            record.value.draft = ""
            record.draftRevision = draftRevision
        }
        try commit(record)
    }

    func status(_ status: OutgoingMessage.Status, id: UUID, lease: Lease) throws {
        var record = try checked(lease)
        guard let index = record.value.outgoing.firstIndex(where: { $0.id == id }) else { return }
        record.value.outgoing[index].status = status
        try commit(record)
    }

    func acknowledge(_ ids: Set<UUID>, lease: Lease) throws {
        var record = try checked(lease)
        record.value.outgoing.removeAll { ids.contains($0.id) }
        try commit(record)
    }

    func restore(_ id: UUID, draftRevision: Int, lease: Lease) throws -> String? {
        var record = try checked(lease)
        guard record.value.draft.isEmpty,
            let message = record.value.outgoing.first(where: {
                $0.id == id && $0.status == .rejected
            })
        else { return nil }
        record.value.draft = message.text
        record.draftRevision = max(record.draftRevision, draftRevision)
        record.value.outgoing.removeAll { $0.id == id }
        try commit(record)
        return message.text
    }

    func retainRejected(_ message: OutgoingMessage, lease: Lease) throws {
        var record = try checked(lease)
        guard !record.value.outgoing.contains(where: { $0.id == message.id }) else { return }
        record.value.outgoing.append(message)
        try commit(record)
    }

    func revoke(owner: UUID, meeting: UUID, generation: Int) throws {
        guard generation >= self.generation else { return }
        records.removeValue(forKey: meeting)
        try storage.remove(owner: owner, meeting: meeting)
    }

    func invalidate(owner: UUID?, generation: Int, erase: Bool) throws {
        guard generation >= self.generation else { return }
        self.generation = generation
        records.removeAll()
        if erase, let owner { try storage.removeAccount(owner) }
    }

    private func checked(_ lease: Lease) throws -> OpenRecord {
        guard generation == lease.generation, let record = records[lease.meeting],
            record.lease == lease
        else { throw ClientFailure.staleSession }
        return record
    }

    private func commit(_ record: OpenRecord) throws {
        try storage.save(record.value)
        records[record.lease.meeting] = record
    }
}

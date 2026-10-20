import Foundation

struct DraftRecord: Codable, Equatable, Sendable {
    let ownerID: UUID
    var requestID = UUID()
    var value: MeetingDraft
    var submission: CreateMeeting?
}

protocol DraftPersistence: Sendable {
    func load(owner: UUID) throws -> DraftRecord?
    func save(_ record: DraftRecord) throws
    func remove(owner: UUID) throws
}

actor DraftRepository {
    private let storage: any DraftPersistence
    private var generation = UUID()
    init(storage: any DraftPersistence) { self.storage = storage }

    func open(owner: UUID) throws -> (UUID, DraftRecord?) {
        try Task.checkCancellation()
        generation = UUID()
        let record = try storage.load(owner: owner)
        guard record == nil || record?.ownerID == owner else { throw ClientFailure.invalidResponse }
        return (generation, record)
    }

    func save(_ record: DraftRecord, lease: UUID) throws {
        try Task.checkCancellation()
        guard lease == generation else { throw ClientFailure.staleSession }
        try storage.save(record)
    }

    func remove(owner: UUID, lease: UUID) throws {
        try Task.checkCancellation()
        guard lease == generation else { throw ClientFailure.staleSession }
        try storage.remove(owner: owner)
        generation = UUID()
    }
}

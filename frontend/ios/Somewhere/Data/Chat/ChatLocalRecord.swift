import Foundation

struct ChatLocalRecord: Codable, Equatable, Sendable {
    let schemaVersion: Int
    let ownerID: UUID
    let meetingID: UUID
    var draft: String
    var outgoing: [OutgoingMessage]

    init(ownerID: UUID, meetingID: UUID, draft: String = "", outgoing: [OutgoingMessage] = []) {
        schemaVersion = 1
        self.ownerID = ownerID
        self.meetingID = meetingID
        self.draft = draft
        self.outgoing = outgoing
    }

    func validate(owner: UUID, meeting: UUID) throws {
        guard schemaVersion == 1, ownerID == owner, meetingID == meeting,
            Set(outgoing.map(\.id)).count == outgoing.count,
            outgoing.allSatisfy({
                !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    && $0.text.unicodeScalars.count <= 4000
            })
        else { throw ChatStorageFailure.invalidRecord }
    }
}

enum ChatStorageFailure: Error, Equatable {
    case invalidRecord
    case missingKey
}

protocol ChatPersistence: Sendable {
    func load(owner: UUID, meeting: UUID) throws -> ChatLocalRecord?
    func save(_ record: ChatLocalRecord) throws
    func remove(owner: UUID, meeting: UUID) throws
    func removeAccount(_ owner: UUID) throws
}

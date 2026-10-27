import Foundation
import os

@testable import Somewhere

final class MemoryChatStorage: ChatPersistence, Sendable {
    private let records = OSAllocatedUnfairLock(initialState: [UUID: ChatLocalRecord]())
    let fails: Bool
    init(fails: Bool = false) { self.fails = fails }
    func load(owner: UUID, meeting: UUID) throws -> ChatLocalRecord? {
        records.withLock { $0[meeting].flatMap { $0.ownerID == owner ? $0 : nil } }
    }
    func save(_ record: ChatLocalRecord) throws {
        if fails { throw ChatStorageFailure.missingKey }
        records.withLock { $0[record.meetingID] = record }
    }
    func remove(owner: UUID, meeting: UUID) throws {
        records.withLock { if $0[meeting]?.ownerID == owner { $0.removeValue(forKey: meeting) } }
    }
    func removeAccount(_ owner: UUID) throws {
        records.withLock { $0 = $0.filter { $0.value.ownerID != owner } }
    }
}

import Foundation
import os

@testable import Somewhere

final class MemoryDraftStorage: DraftPersistence, Sendable {
    private let records = OSAllocatedUnfairLock(initialState: [UUID: DraftRecord]())
    let fails: Bool
    init(fails: Bool = false) { self.fails = fails }
    func load(owner: UUID) throws -> DraftRecord? { records.withLock { $0[owner] } }
    func save(_ record: DraftRecord) throws {
        if fails { throw ClientFailure.invalidResponse }
        records.withLock { $0[record.ownerID] = record }
    }
    func remove(owner: UUID) throws { _ = records.withLock { $0.removeValue(forKey: owner) } }
}

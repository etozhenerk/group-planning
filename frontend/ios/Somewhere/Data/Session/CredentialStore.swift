actor CredentialStore {
    private let storage: any CredentialStorage
    private var generation = 0

    init(storage: any CredentialStorage) { self.storage = storage }

    func load(generation: Int) throws -> StoredSession? {
        try advance(to: generation)
        return try storage.load()
    }

    func save(_ credential: StoredSession, generation: Int) throws {
        try Task.checkCancellation()
        try advance(to: generation)
        try storage.save(credential)
    }

    func remove(generation: Int) throws {
        try advance(to: generation)
        try storage.remove()
    }

    private func advance(to proposed: Int) throws {
        guard proposed >= generation else { throw ClientFailure.staleSession }
        generation = proposed
    }
}

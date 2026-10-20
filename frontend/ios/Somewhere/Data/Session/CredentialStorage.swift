protocol CredentialStorage: Sendable {
    func load() throws -> StoredSession?
    func save(_ credential: StoredSession) throws
    func remove() throws
}

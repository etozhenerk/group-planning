import Foundation
import Security
import Testing

@testable import Somewhere

struct KeychainTests {
    @Test func persistenceAndOriginIsolation() throws {
        let first = KeychainCredentialStorage(
            origin: try APIOrigin(#require(URL(string: "https://one.example.test"))),
            service: "somewhere-tests-\(UUID())")
        let second = KeychainCredentialStorage(
            origin: try APIOrigin(#require(URL(string: "https://two.example.test"))),
            service: first.service)
        defer {
            try? first.remove()
            try? second.remove()
        }
        let credential = try StoredSession(
            token: "test-keychain", expiresAt: Date().addingTimeInterval(3600))
        try first.save(credential)
        let restored = KeychainCredentialStorage(origin: first.origin, service: first.service)
        #expect(try restored.load()?.token == credential.token)
        #expect(try restored.load()?.id == credential.id)
        #expect(try second.load() == nil)
        let replacement = try StoredSession(token: "replacement", expiresAt: credential.expiresAt)
        try first.save(replacement)
        #expect(try restored.load()?.token == replacement.token)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: first.service,
            kSecAttrAccount as String: first.origin.url.absoluteString,
            kSecReturnAttributes as String: true,
        ]
        var item: CFTypeRef?
        #expect(SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess)
        let attributes = try #require(item as? [String: Any])
        #expect(
            attributes[kSecAttrAccessible as String] as? String
                == kSecAttrAccessibleWhenUnlockedThisDeviceOnly as String)
        #expect(attributes[kSecAttrSynchronizable as String] as? Bool != true)
        try first.remove()
        #expect(try restored.load() == nil)
    }

    @Test func staleSaveCannotRestoreRemovedSession() async throws {
        let memory = MemoryCredentialStorage()
        let store = CredentialStore(storage: memory)
        let credential = try StoredSession(
            token: "test-generation", expiresAt: Date().addingTimeInterval(3600))
        try await store.save(credential, generation: 2)
        try await store.remove(generation: 3)
        await #expect(throws: ClientFailure.staleSession) {
            try await store.save(credential, generation: 1)
        }
        #expect(try memory.load() == nil)
    }
}

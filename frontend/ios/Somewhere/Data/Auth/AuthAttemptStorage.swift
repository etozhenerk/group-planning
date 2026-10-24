import Foundation
import Security

protocol AuthAttemptStorage: Sendable {
    func load() throws -> PendingAuthAttempt?
    func save(_ attempt: PendingAuthAttempt) throws
    func clear() throws
}

struct KeychainAuthAttemptStorage: AuthAttemptStorage {
    let origin: APIOrigin
    var service = "dev.groupplanning.ios.auth-attempt"
    private var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
            kSecAttrAccount as String: origin.url.absoluteString,
            kSecAttrSynchronizable as String: false,
        ]
    }

    func load() throws -> PendingAuthAttempt? {
        var lookup = query
        lookup[kSecReturnData as String] = true
        lookup[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(lookup as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else {
            throw ClientFailure.keychain(status)
        }
        return try JSONDecoder().decode(PendingAuthAttempt.self, from: data)
    }

    func save(_ attempt: PendingAuthAttempt) throws {
        let attributes: [String: Any] = [
            kSecValueData as String: try JSONEncoder().encode(attempt),
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            status = SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil)
        }
        guard status == errSecSuccess else { throw ClientFailure.keychain(status) }
    }

    func clear() throws {
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw ClientFailure.keychain(status)
        }
    }
}

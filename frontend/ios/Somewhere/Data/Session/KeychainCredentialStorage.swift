import Foundation
import Security

struct KeychainCredentialStorage: CredentialStorage {
    let origin: APIOrigin
    let service: String

    init(origin: APIOrigin, service: String = "dev.groupplanning.ios.session") {
        self.origin = origin
        self.service = service
    }

    private var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: origin.url.absoluteString,
            kSecAttrSynchronizable as String: false,
        ]
    }

    func load() throws -> StoredSession? {
        var lookup = query
        lookup[kSecReturnData as String] = true
        lookup[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(lookup as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw ClientFailure.keychain(status) }
        guard let data = item as? Data else { throw ClientFailure.invalidStoredSession }
        do { return try JSONDecoder().decode(StoredSession.self, from: data) } catch {
            throw ClientFailure.invalidStoredSession
        }
    }

    func save(_ credential: StoredSession) throws {
        let attributes: [String: Any] = [
            kSecValueData as String: try JSONEncoder().encode(credential),
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            status = SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil)
        }
        guard status == errSecSuccess else { throw ClientFailure.keychain(status) }
    }

    func remove() throws {
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw ClientFailure.keychain(status)
        }
    }
}

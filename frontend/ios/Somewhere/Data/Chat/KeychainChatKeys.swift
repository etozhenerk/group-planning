import CryptoKit
import Foundation
import Security

struct KeychainChatKeys: Sendable {
    let origin: APIOrigin
    var service = "dev.groupplanning.ios.chat-outbox"

    func load(owner: UUID) throws -> SymmetricKey? {
        var lookup = query(owner)
        lookup[kSecReturnData as String] = true
        lookup[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(lookup as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw ClientFailure.keychain(status) }
        guard let data = result as? Data, data.count == 32 else {
            throw ChatStorageFailure.invalidRecord
        }
        return SymmetricKey(data: data)
    }

    func loadOrCreate(owner: UUID) throws -> SymmetricKey {
        if let key = try load(owner: owner) { return key }
        let key = SymmetricKey(size: .bits256)
        var attributes = query(owner)
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        attributes[kSecValueData as String] = key.withUnsafeBytes { Data($0) }
        let status = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecDuplicateItem, let existing = try load(owner: owner) { return existing }
        guard status == errSecSuccess else { throw ClientFailure.keychain(status) }
        return key
    }

    func remove(owner: UUID) throws {
        let status = SecItemDelete(query(owner) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw ClientFailure.keychain(status)
        }
    }

    private func query(_ owner: UUID) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: origin.url.absoluteString + "/"
                + owner.uuidString.lowercased(),
            kSecAttrSynchronizable as String: false,
        ]
    }
}

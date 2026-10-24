import CryptoKit
import Foundation
import Security

struct AuthProof: Sendable {
    let verifier: String
    var challenge: String { Self.encode(Data(SHA256.hash(data: Data(verifier.utf8)))) }

    static func generate() throws -> AuthProof {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
            throw ClientFailure.invalidRequest
        }
        return AuthProof(verifier: encode(Data(bytes)))
    }

    private static func encode(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

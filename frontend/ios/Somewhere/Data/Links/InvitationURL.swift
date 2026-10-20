import Foundation

enum InvitationURL {
    static func token(from url: URL, origin: APIOrigin?, scheme: String) -> String? {
        guard let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
            parts.user == nil, parts.password == nil, parts.query == nil, parts.fragment == nil
        else { return nil }
        let path: [String]
        if parts.scheme == scheme, parts.host == "i", parts.port == nil {
            path = parts.percentEncodedPath.components(separatedBy: "/")
            guard path.count == 2, path[0].isEmpty else { return nil }
        } else {
            guard parts.scheme == "https", let origin,
                parts.host == origin.url.host,
                (parts.port ?? 443) == (origin.url.port ?? 443)
            else { return nil }
            path = parts.percentEncodedPath.components(separatedBy: "/")
            guard path.count == 3, path[0].isEmpty,
                ["i", "invitations"].contains(path[1])
            else { return nil }
        }
        guard let token = path.last, valid(token) else { return nil }
        return token
    }

    static func valid(_ token: String) -> Bool {
        guard APIRequest.isInvitationToken(token) else { return false }
        let normalized = token.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let padding = String(repeating: "=", count: (4 - normalized.count % 4) % 4)
        guard let data = Data(base64Encoded: normalized + padding),
            [16, 32].contains(data.count)
        else { return false }
        return data.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
            == token
    }
}

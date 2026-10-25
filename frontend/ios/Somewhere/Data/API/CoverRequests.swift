import Foundation

enum CoverRequests {
    static func read(_ url: URL, meetingID: UUID, origin: APIOrigin) throws -> APIRequest {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
            let base = URLComponents(url: origin.url, resolvingAgainstBaseURL: false),
            components.scheme == base.scheme, components.host == base.host,
            components.port == base.port, components.user == nil, components.password == nil,
            components.fragment == nil
        else { throw ClientFailure.invalidRequest }
        let path = components.path.split(separator: "/").map(String.init)
        guard path.count == 5, path[0] == "api", path[1] == "v1", path[4] == "cover",
            let query = components.queryItems, query.count == 1,
            query[0].name == "v", let version = query[0].value,
            version.utf8.count == 64,
            version.utf8.allSatisfy({ (48...57).contains($0) || (97...102).contains($0) })
        else { throw ClientFailure.invalidRequest }
        let isPrivate = path[2] == "meetings"
        guard
            (isPrivate && UUID(uuidString: path[3]) == meetingID)
                || (path[2] == "invitations" && APIRequest.isInvitationToken(path[3]))
        else { throw ClientFailure.invalidRequest }
        return APIRequest(
            path: Array(path.dropFirst(2)), query: query,
            meetingID: isPrivate ? meetingID : nil,
            invalidatesMeetingOnForbidden: isPrivate)
    }
}

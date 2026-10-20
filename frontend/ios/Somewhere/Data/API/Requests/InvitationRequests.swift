import Foundation

enum InvitationRequests {
    static func preview(_ token: String) throws -> APIRequest {
        guard APIRequest.isInvitationToken(token) else { throw ClientFailure.invalidRequest }
        return APIRequest(path: ["invitations", token])
    }

    static func respond(_ token: String, input: RSVPRequest, key: UUID) throws -> APIRequest {
        guard APIRequest.isInvitationToken(token) else { throw ClientFailure.invalidRequest }
        return try .json(path: ["invitations", token, "rsvp"], method: .put, body: input, key: key)
    }

    static func respond(to id: UUID, input: RSVPRequest, key: UUID) throws -> APIRequest {
        try .json(
            path: ["meetings", id.uuidString.lowercased(), "rsvp"], method: .put,
            body: input, key: key)
    }
}

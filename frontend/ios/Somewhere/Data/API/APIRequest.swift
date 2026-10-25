import Foundation

struct APIRequest: Sendable {
    enum Method: String, Sendable {
        case delete = "DELETE"
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case patch = "PATCH"
    }

    let path: [String]
    var method: Method = .get
    var deletionToken: String?
    var body: Data?
    var idempotencyKey: UUID?
    var query: [URLQueryItem] = []
    var expectedStatus: Int = 200
    var meetingID: UUID?
    var invalidatesMeetingOnForbidden = false

    static func json<Value: Encodable>(
        path: [String], method: Method, body: Value,
        key: UUID? = nil, status: Int = 200, meetingID: UUID? = nil,
        invalidatesMeetingOnForbidden: Bool = false
    ) throws -> APIRequest {
        APIRequest(
            path: path, method: method, body: try APICoding.encode(body),
            idempotencyKey: key, expectedStatus: status, meetingID: meetingID,
            invalidatesMeetingOnForbidden: invalidatesMeetingOnForbidden)
    }

    static func isInvitationToken(_ token: String) -> Bool {
        (token.utf8.count == 22 || token.utf8.count == 43) && isPathComponent(token)
    }

    static func isPathComponent(_ value: String) -> Bool {
        !value.isEmpty
            && value.utf8.allSatisfy {
                (48...57).contains($0) || (65...90).contains($0) || (97...122).contains($0)
                    || $0 == 45 || $0 == 95
            }
    }
}

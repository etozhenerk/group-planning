import Foundation

enum SessionRequests {
    static let me = APIRequest(path: ["me"])
    static let logout = APIRequest(path: ["auth", "logout"], method: .post, expectedStatus: 204)

    static func start(context: ReturnContext, challenge: String) throws -> APIRequest {
        try .json(
            path: ["auth", "yandex", "start"], method: .post,
            body: AuthStart(returnContext: context, appChallenge: challenge))
    }

    static func exchange(_ input: MobileExchange) throws -> APIRequest {
        try .json(path: ["auth", "mobile", "exchange"], method: .post, body: input)
    }
}

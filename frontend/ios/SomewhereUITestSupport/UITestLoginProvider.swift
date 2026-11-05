import Foundation

// UI fixtures never open an external identity provider.
@MainActor
final class UITestLoginProvider: YandexLoginProvider {
    var result: ((Result<String, NativeLoginFailure>) -> Void)?
    private let profileFields: Bool
    private var nextProfile = 0

    init(profileFields: Bool = false) { self.profileFields = profileFields }

    func authorize() throws {
        switch ProcessInfo.processInfo.environment["SOMEWHERE_UI_LOGIN_OUTCOME"] {
        case "success":
            result?(.success("profile-fields-full"))
            return
        case "cancelled":
            result?(.failure(.cancelled))
            return
        case "hold": return
        default: break
        }
        let stages = ["full", "partial", "clear"]
        guard profileFields, nextProfile < stages.count else { throw NativeLoginFailure.failed }
        let token = "profile-fields-" + stages[nextProfile]
        nextProfile += 1
        result?(.success(token))
    }
    func matches(_ url: URL) -> Bool { false }
    func open(_ url: URL) throws { throw NativeLoginFailure.failed }
    func clear() throws {}
}

import Foundation

// UI fixtures never open an external identity provider.
@MainActor
final class UITestLoginProvider: YandexLoginProvider {
    var result: ((Result<String, NativeLoginFailure>) -> Void)?
    func authorize() throws { throw NativeLoginFailure.failed }
    func matches(_ url: URL) -> Bool { false }
    func open(_ url: URL) throws { throw NativeLoginFailure.failed }
    func clear() throws {}
}

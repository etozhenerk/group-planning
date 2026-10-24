import Foundation

enum NativeLoginFailure: Error, Sendable { case cancelled, failed }

@MainActor
protocol YandexLoginProvider: AnyObject {
    var result: ((Result<String, NativeLoginFailure>) -> Void)? { get set }
    func authorize() throws
    func matches(_ url: URL) -> Bool
    func open(_ url: URL) throws
    func clear() throws
}

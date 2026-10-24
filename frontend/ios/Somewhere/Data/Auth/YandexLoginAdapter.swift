import AuthenticationServices
import UIKit
@preconcurrency import YandexLoginSDK

@MainActor
final class YandexLoginAdapter: YandexLoginProvider, YandexLoginSDKObserver {
    var result: ((Result<String, NativeLoginFailure>) -> Void)?
    private let clientID: String
    private let webOnly: Bool
    private var activated = false

    init(clientID: String, webOnly: Bool = false) {
        self.clientID = clientID
        self.webOnly = webOnly
    }

    private func activate() throws {
        if activated { return }
        try YandexLoginSDK.shared.activate(
            with: clientID, authorizationStrategy: webOnly ? .webOnly : .default)
        YandexLoginSDK.shared.add(observer: self)
        activated = true
    }

    func authorize() throws {
        try activate()
        guard
            var parent = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene })
                .filter({ $0.activationState == .foregroundActive }).flatMap(\.windows)
                .first(where: \.isKeyWindow)?.rootViewController
        else { throw ClientFailure.invalidRequest }
        while let presented = parent.presentedViewController { parent = presented }
        try YandexLoginSDK.shared.authorize(
            with: parent, authorizationStrategy: webOnly ? .webOnly : .default)
    }

    func matches(_ url: URL) -> Bool {
        url.scheme == "yx" + clientID
            || (url.scheme == "https"
                && ["yx" + clientID + ".oauth.yandex.ru", "yx" + clientID + ".oauth.yandex.com"]
                    .contains(url.host))
    }

    func open(_ url: URL) throws {
        try activate()
        guard matches(url) else { throw ClientFailure.invalidResponse }
        if url.scheme == "https" {
            let activity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
            activity.webpageURL = url
            try YandexLoginSDK.shared.handleUserActivity(activity)
        } else {
            try YandexLoginSDK.shared.handleOpenURL(url)
        }
    }

    func clear() throws {
        try activate()
        try YandexLoginSDK.shared.logout()
    }

    nonisolated func didFinishLogin(with result: Result<LoginResult, any Error>) {
        let outcome: Result<String, NativeLoginFailure>
        switch result {
        case .success(let value): outcome = .success(value.token)
        case .failure(let error):
            let cancelled = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin
            outcome = .failure(cancelled ? .cancelled : .failed)
        }
        Task { @MainActor [weak self] in self?.result?(outcome) }
    }
}

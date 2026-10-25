import Foundation
import Observation

@MainActor @Observable
final class YandexSignIn {
    private(set) var busy = false
    private(set) var problem: String?
    private(set) var completedContext: ReturnContext?
    @ObservationIgnored private let api: APIClient
    @ObservationIgnored private let session: SessionStore
    @ObservationIgnored private let storage: any AuthAttemptStorage
    @ObservationIgnored private let provider: any YandexLoginProvider
    @ObservationIgnored private var task: Task<Void, Never>?
    @ObservationIgnored private var exchanging = false

    init(
        api: APIClient, session: SessionStore, storage: any AuthAttemptStorage,
        provider: any YandexLoginProvider
    ) {
        self.api = api
        self.session = session
        self.storage = storage
        self.provider = provider
        provider.result = { [weak self] result in self?.received(result) }
    }

    func start(_ context: ReturnContext) {
        guard !busy else { return }
        busy = true
        problem = nil
        completedContext = nil
        task = Task {
            do {
                try storage.clear()
                try provider.clear()
                let proof = try AuthProof.generate()
                let started = try await api.send(
                    .json(
                        path: ["auth", "yandex", "start"], method: .post,
                        body: AuthStart(returnContext: context, appChallenge: proof.challenge)),
                    as: AuthStarted.self)
                try Task.checkCancellation()
                guard started.expiresAt.date > Date() else { throw ClientFailure.invalidResponse }
                try storage.save(
                    PendingAuthAttempt(
                        id: started.attemptID, verifier: proof.verifier,
                        expiresAt: started.expiresAt.date, context: context))
                try provider.authorize()
            } catch { finish(error) }
        }
    }

    func matches(_ url: URL) -> Bool { provider.matches(url) }

    @discardableResult
    func resume(_ url: URL) -> Bool {
        guard matches(url) else { return false }
        do {
            guard let attempt = try storage.load(), attempt.expiresAt > Date() else {
                throw ClientFailure.invalidResponse
            }
            busy = true
            try provider.open(url)
        } catch { finish(error) }
        return true
    }

    func clearAccount() throws {
        task?.cancel()
        task = nil
        try storage.clear()
        try provider.clear()
        completedContext = nil
        problem = nil
        busy = false
    }

    func dismissProblem() { problem = nil }

    private func received(_ result: Result<String, NativeLoginFailure>) {
        guard !exchanging else { return }
        exchanging = true
        busy = true
        task = Task {
            defer {
                exchanging = false
                busy = false
                task = nil
            }
            do {
                let token = try result.get()
                guard let attempt = try storage.load(), attempt.expiresAt > Date(),
                    !token.isEmpty, token.count <= 4096
                else { throw ClientFailure.invalidResponse }
                try storage.clear()
                // Keep only the somewhere session after verifying the SDK result.
                try provider.clear()
                let sessionResult = try await api.send(
                    .json(
                        path: ["auth", "mobile", "sdk", "exchange"],
                        method: .post,
                        body: MobileSDKExchange(
                            attemptID: attempt.id, oauthToken: token,
                            appVerifier: attempt.verifier)), as: MobileSession.self)
                try Task.checkCancellation()
                guard sessionResult.returnContext == attempt.context,
                    sessionResult.expiresAt.date > Date()
                else { throw ClientFailure.invalidResponse }
                try await session.accept(
                    StoredSession(
                        token: sessionResult.sessionToken, expiresAt: sessionResult.expiresAt.date))
                completedContext = sessionResult.returnContext
            } catch { finish(error) }
        }
    }

    private func finish(_ error: any Error) {
        busy = false
        do {
            try storage.clear()
            try provider.clear()
        } catch {
            problem = "Не удалось завершить вход. Попробуйте ещё раз."
            return
        }
        if (error as? NativeLoginFailure) == .cancelled || error is CancellationError { return }
        problem = "Попробуйте ещё раз."
    }
}

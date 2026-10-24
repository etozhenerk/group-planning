import Foundation
import Testing
import os

@testable import Somewhere

final class MemoryAuthAttempts: AuthAttemptStorage, Sendable {
    private let value = OSAllocatedUnfairLock<PendingAuthAttempt?>(initialState: nil)
    func load() throws -> PendingAuthAttempt? { value.withLock { $0 } }
    func save(_ attempt: PendingAuthAttempt) throws { value.withLock { $0 = attempt } }
    func clear() throws { value.withLock { $0 = nil } }
}

@MainActor
final class AuthTestProvider: YandexLoginProvider {
    var result: ((Result<String, NativeLoginFailure>) -> Void)?
    var calls = 0
    var clears = 0
    var outcome: Result<String, NativeLoginFailure> = .success("sdk-test-token")
    func authorize() throws {
        calls += 1
        result?(outcome)
    }
    func matches(_ url: URL) -> Bool { url.scheme == "sdk-test" }
    func open(_ url: URL) throws { result?(outcome) }
    func clear() throws { clears += 1 }
}

@MainActor
struct YandexSignInTests {
    let id = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
    let scheme = "sdk-test"

    @Test func proofMatchesPKCEVector() throws {
        let proof = AuthProof(verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
        #expect(proof.challenge == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
        let first = try AuthProof.generate()
        #expect(first.verifier.count == 43)
        #expect(first.verifier != (try AuthProof.generate()).verifier)
    }

    @Test func coldCallbackRestoresInvitationAndCannotReplay() async throws {
        let harness = try SessionHarness()
        let storage = MemoryAuthAttempts()
        let token = String(repeating: "a", count: 22)
        try storage.save(pending(context: .invitation(token)))
        await harness.transport.enqueue(
            "/api/v1/auth/mobile/sdk/exchange", data: exchange(token: token))
        await harness.transport.enqueue("/api/v1/me", data: try Fixtures.me())
        let owner = YandexSignIn(
            api: harness.session.api, session: harness.session,
            storage: storage, provider: AuthTestProvider())
        owner.resume(try callback())
        try await finish(owner)
        #expect(owner.problem == nil)
        #expect(owner.completedContext == .invitation(token))
        #expect(harness.session.status == .authenticated)
        #expect(try storage.load() == nil)
        #expect(try harness.storage.load()?.token == "native-session")
        owner.resume(try callback())
        try await finish(owner)
        #expect(owner.problem != nil)
        #expect(await harness.transport.count("/api/v1/auth/mobile/sdk/exchange") == 1)
        #expect(await harness.transport.requests.count == 2)
    }

    @Test func cancellationClearsAttemptWithoutExchange() async throws {
        let harness = try SessionHarness()
        let storage = MemoryAuthAttempts()
        let provider = AuthTestProvider()
        provider.outcome = .failure(.cancelled)
        await harness.transport.enqueue("/api/v1/auth/yandex/start", data: started())
        let owner = YandexSignIn(
            api: harness.session.api, session: harness.session,
            storage: storage, provider: provider)
        owner.start(.home)
        owner.start(.home)
        try await finish(owner)
        #expect(provider.calls == 1)
        #expect(owner.problem == nil)
        #expect(try storage.load() == nil)
        #expect(await harness.transport.count("/api/v1/auth/mobile/sdk/exchange") == 0)
        #expect(await harness.transport.count("/api/v1/auth/yandex/start") == 1)
    }

    @Test func issuedSessionSurvivesMeNetworkFailure() async throws {
        let harness = try SessionHarness()
        let storage = MemoryAuthAttempts()
        try storage.save(pending())
        await harness.transport.enqueue("/api/v1/auth/mobile/sdk/exchange", data: exchange())
        let owner = YandexSignIn(
            api: harness.session.api, session: harness.session,
            storage: storage, provider: AuthTestProvider())
        owner.resume(try callback())
        try await finish(owner)
        #expect(harness.session.status == .failed)
        #expect(try harness.storage.load()?.token == "native-session")
        await harness.transport.enqueue("/api/v1/me", data: try Fixtures.me())
        await harness.session.restore()
        #expect(harness.session.status == .authenticated)
        #expect(await harness.transport.count("/api/v1/auth/mobile/sdk/exchange") == 1)
    }

    private func pending(context: ReturnContext = .home) -> PendingAuthAttempt {
        PendingAuthAttempt(
            id: id, verifier: String(repeating: "x", count: 43),
            expiresAt: Date().addingTimeInterval(600), context: context)
    }
    private func callback() throws -> URL {
        try #require(
            URL(
                string: "\(scheme)://auth/callback?attempt_id=\(id.uuidString)&handoff_code=one-use"
            ))
    }
    private func started() -> Data {
        Data(
            """
            {"attempt_id":"\(id.uuidString)","authorization_url":"https://oauth.yandex.ru/authorize?client_id=test","expires_at":"2099-01-01T00:00:00Z"}
            """.utf8)
    }
    private func exchange(token: String? = nil) -> Data {
        let context =
            token.map { "{\"kind\":\"invitation\",\"token\":\"\($0)\"}" } ?? "{\"kind\":\"home\"}"
        return Data(
            """
            {"session_token":"native-session","expires_at":"2099-01-01T00:00:00Z","return_context":\(context)}
            """.utf8)
    }
    private func finish(_ owner: YandexSignIn) async throws {
        for _ in 0..<200 {
            if !owner.busy { return }
            try await Task.sleep(for: .milliseconds(10))
        }
        Issue.record("Authentication did not finish")
    }
}

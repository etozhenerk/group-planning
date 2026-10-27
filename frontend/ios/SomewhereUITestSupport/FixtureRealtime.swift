import Foundation
import Security

// Compiled only into the QA host. The ordinary app keeps system TLS validation.
@MainActor
final class FixtureRealtime: ChatRealtimeTransport {
    private let base: ChatRealtime
    private var scope = "personal"
    private init(origin: URL, certificate: Data) {
        base = ChatRealtime { configuration in
            configuration.tlsChallengeHandler = { @Sendable challenge, completion in
                let space = challenge.protectionSpace
                guard space.authenticationMethod == NSURLAuthenticationMethodServerTrust,
                    origin.scheme == "https", origin.host == "127.0.0.1",
                    space.host == origin.host, space.port == origin.port,
                    let trust = space.serverTrust,
                    let anchor = SecCertificateCreateWithData(nil, certificate as CFData),
                    SecTrustSetAnchorCertificates(trust, [anchor] as CFArray) == errSecSuccess,
                    SecTrustSetAnchorCertificatesOnly(trust, true) == errSecSuccess,
                    SecTrustEvaluateWithError(trust, nil)
                else {
                    completion(.cancelAuthenticationChallenge, nil)
                    return
                }
                completion(.useCredential, URLCredential(trust: trust))
            }
        }
    }
    static func make(origin: URL, certificate: Data) -> any ChatRealtimeTransport {
        FixtureRealtime(origin: origin, certificate: certificate)
    }
    func connect(
        origin: APIOrigin, token: String, meeting: UUID?,
        receive: @escaping @MainActor @Sendable (ChatRealtimeEvent) -> Void
    ) throws {
        scope = meeting == nil ? "personal" : "meeting"
        try base.connect(origin: origin, token: token, meeting: meeting) { [weak self] event in
            switch event {
            case .subscribed: self?.record("subscribed")
            case .hint: self?.record("hint")
            case .disconnected: self?.record("disconnected")
            case .unsubscribed: self?.record("unsubscribed")
            }
            receive(event)
        }
    }
    func disconnect() {
        base.disconnect()
        record("closed")
    }
    private func record(_ event: String) {
        guard let path = ProcessInfo.processInfo.environment["SOMEWHERE_UI_CHAT_TRACE"] else {
            return
        }
        do {
            let previous = try? Data(contentsOf: URL(fileURLWithPath: path))
            var events =
                previous.flatMap { try? JSONDecoder().decode([String: Int].self, from: $0) } ?? [:]
            events[scope + "_" + event, default: 0] += 1
            let data = try JSONEncoder().encode(events)
            try data.write(to: URL(fileURLWithPath: path), options: .atomic)
        } catch { print("SOMEWHERE_CHAT_TRACE_WRITE_FAILED") }
    }
}

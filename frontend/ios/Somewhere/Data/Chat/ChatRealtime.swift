import Foundation
import SwiftCentrifuge

enum ChatRealtimeEvent: Sendable {
    case subscribed
    case hint(Data)
    case disconnected(UInt32)
    case unsubscribed(UInt32)
}

@MainActor
protocol ChatRealtimeTransport: AnyObject {
    func connect(
        origin: APIOrigin, token: String, meeting: UUID?,
        receive: @escaping @MainActor @Sendable (ChatRealtimeEvent) -> Void) throws
    func disconnect()
}

@MainActor
final class ChatRealtime: ChatRealtimeTransport {
    private let configure: (inout CentrifugeClientConfig) -> Void
    init(configure: @escaping (inout CentrifugeClientConfig) -> Void = { _ in }) {
        self.configure = configure
    }
    private var client: CentrifugeClient?
    private var delegate: ChatRealtimeDelegate?

    func connect(
        origin: APIOrigin, token: String, meeting: UUID?,
        receive: @escaping @MainActor @Sendable (ChatRealtimeEvent) -> Void
    ) throws {
        disconnect()
        var url = URLComponents(url: origin.url, resolvingAgainstBaseURL: false)
        url?.scheme = "wss"
        url?.path = "/api/v1/realtime"
        guard let endpoint = url?.url else { throw ClientFailure.invalidOrigin }
        let delegate = ChatRealtimeDelegate(personalOnly: meeting == nil) { event in
            Task { @MainActor in receive(event) }
        }
        var configuration = CentrifugeClientConfig(
            headers: ["Authorization": "Bearer " + token], useNativeWebSocket: true,
            urlSessionConfigurationProvider: { @Sendable in
                let config = URLSessionConfiguration.ephemeral
                config.httpShouldSetCookies = false
                config.httpCookieStorage = nil
                config.urlCache = nil
                return config
            })
        configure(&configuration)
        let client = CentrifugeClient(
            endpoint: endpoint.absoluteString,
            config: configuration, delegate: delegate)
        self.delegate = delegate
        self.client = client
        if let meeting {
            let subscription = try client.newSubscription(
                channel: "meeting:" + meeting.uuidString.lowercased(), delegate: delegate)
            subscription.subscribe()
        }
        client.connect()
    }

    func disconnect() {
        client?.disconnect()
        client = nil
        delegate = nil
    }
}

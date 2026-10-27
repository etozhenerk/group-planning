import Foundation
import SwiftCentrifuge

final class ChatRealtimeDelegate: CentrifugeClientDelegate, CentrifugeSubscriptionDelegate, Sendable
{
    private let personalOnly: Bool
    private let receive: @Sendable (ChatRealtimeEvent) -> Void
    init(personalOnly: Bool = false, receive: @escaping @Sendable (ChatRealtimeEvent) -> Void) {
        self.personalOnly = personalOnly
        self.receive = receive
    }
    func onSubscribed(_ client: CentrifugeClient, _ event: CentrifugeServerSubscribedEvent) {
        if personalOnly { receive(.subscribed) }
    }

    func onSubscribed(_ sub: CentrifugeSubscription, _ event: CentrifugeSubscribedEvent) {
        receive(.subscribed)
    }
    func onPublication(_ sub: CentrifugeSubscription, _ event: CentrifugePublicationEvent) {
        receive(.hint(event.data))
    }
    func onPublication(_ client: CentrifugeClient, _ event: CentrifugeServerPublicationEvent) {
        receive(.hint(event.data))
    }
    func onConnecting(_ client: CentrifugeClient, _ event: CentrifugeConnectingEvent) {
        receive(.disconnected(event.code))
    }
    func onDisconnected(_ client: CentrifugeClient, _ event: CentrifugeDisconnectedEvent) {
        receive(.disconnected(event.code))
    }
    func onUnsubscribed(_ sub: CentrifugeSubscription, _ event: CentrifugeUnsubscribedEvent) {
        receive(.unsubscribed(event.code))
    }
}

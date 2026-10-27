package dev.groupplanning.android.data.realtime

import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import io.github.centrifugal.centrifuge.Client
import io.github.centrifugal.centrifuge.ConnectedEvent
import io.github.centrifugal.centrifuge.ConnectingEvent
import io.github.centrifugal.centrifuge.DisconnectedEvent
import io.github.centrifugal.centrifuge.ErrorEvent
import io.github.centrifugal.centrifuge.EventListener
import io.github.centrifugal.centrifuge.Options
import io.github.centrifugal.centrifuge.PublicationEvent
import io.github.centrifugal.centrifuge.ServerPublicationEvent
import io.github.centrifugal.centrifuge.SubscribedEvent
import io.github.centrifugal.centrifuge.Subscription
import io.github.centrifugal.centrifuge.SubscriptionEventListener
import io.github.centrifugal.centrifuge.UnsubscribedEvent
import java.util.UUID
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull
import okhttp3.CookieJar
import okhttp3.OkHttpClient

internal class CentrifugeRealtime(origin: ApiOrigin, client: OkHttpClient = OkHttpClient()) :
    ChatRealtime {
    private val endpoint = origin.resolve(ApiRequest(listOf("realtime")))
        .toString().replaceFirst("https://", "wss://")
    private val http = client.newBuilder().followRedirects(false).followSslRedirects(false)
        .cookieJar(CookieJar.NO_COOKIES).cache(null).build()

    override fun events(token: String, owner: UUID, meeting: UUID): Flow<ChatSignal> =
        connect(token, owner, meeting)

    override fun personal(token: String, owner: UUID): Flow<ChatSignal> =
        connect(token, owner, null)

    private fun connect(token: String, owner: UUID, meeting: UUID?): Flow<ChatSignal> =
        callbackFlow {
            fun signal(value: ChatSignal) {
                // Overflow reconnects and catches up; it never silently loses a terminal event.
                if (trySend(value).isFailure) close(ClientFailure(FailureKind.Network))
            }
            fun publication(data: ByteArray, personal: Boolean) {
                val hint = runCatching {
                    apiJson.parseToJsonElement(data.decodeToString()) as? JsonObject
                }.getOrNull() ?: return
                if ((hint["schema_version"] as? JsonPrimitive)?.intOrNull != 1) return
                val id = (hint["meeting_id"] as? JsonPrimitive)?.content
                if (personal) {
                    if (id == meeting.toString() &&
                        (hint["access_revoked"] as? JsonPrimitive)?.booleanOrNull == true
                    ) {
                        signal(ChatSignal.AccessRevoked)
                    } else {
                        signal(ChatSignal.PersonalChanged)
                    }
                } else if (id == meeting.toString()) {
                    signal(ChatSignal.Changed)
                }
            }
            val options = Options().apply {
                headers = mapOf("Authorization" to "Bearer $token")
                okHttpClient = http
            }
            val sdk = Client(
                endpoint,
                options,
                object : EventListener() {
                    override fun onConnected(client: Client, event: ConnectedEvent) {
                        if (meeting == null) signal(ChatSignal.Subscribed)
                    }
                    override fun onConnecting(client: Client, event: ConnectingEvent) {
                        signal(ChatSignal.Disconnected)
                    }
                    override fun onDisconnected(client: Client, event: DisconnectedEvent) {
                        signal(ChatSignal.VerifySession)
                        signal(ChatSignal.Disconnected)
                    }
                    override fun onError(client: Client, event: ErrorEvent) {
                        if (event.httpResponseCode == 401 || event.httpResponseCode == 403) {
                            signal(ChatSignal.VerifySession)
                        }
                    }
                    override fun onPublication(client: Client, event: ServerPublicationEvent) {
                        if (event.channel ==
                            "personal:$owner"
                        ) {
                            publication(event.data.copyOf(), true)
                        }
                    }
                },
            )
            val subscription = meeting?.let {
                sdk.newSubscription(
                    "meeting:$meeting",
                    object : SubscriptionEventListener() {
                        override fun onSubscribed(sub: Subscription, event: SubscribedEvent) {
                            // SDK offset/recovered never becomes the durable HTTP cursor.
                            signal(ChatSignal.Subscribed)
                        }
                        override fun onPublication(sub: Subscription, event: PublicationEvent) {
                            publication(event.data.copyOf(), false)
                        }
                        override fun onUnsubscribed(sub: Subscription, event: UnsubscribedEvent) {
                            signal(
                                if (event.code == 2003 || event.code == 103) {
                                    ChatSignal.AccessRevoked
                                } else {
                                    ChatSignal.Disconnected
                                },
                            )
                        }
                    },
                )
            }
            subscription?.subscribe()
            sdk.connect()
            awaitClose { sdk.close(0) }
        }
}

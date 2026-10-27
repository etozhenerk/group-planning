package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.realtime.CentrifugeRealtime
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.tls.HandshakeCertificates
import okhttp3.tls.HeldCertificate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class CentrifugeTransportTests {
    @Test fun officialSdkUsesVerifiedWssBearerHeaderAndProtobufWithoutQuerySecrets() = runBlocking {
        val certificate = HeldCertificate.Builder().addSubjectAlternativeName("localhost").build()
        val serverTls = HandshakeCertificates.Builder().heldCertificate(certificate).build()
        val clientTls = HandshakeCertificates.Builder().addTrustedCertificate(
            certificate.certificate,
        ).build()
        val http = OkHttpClient.Builder().sslSocketFactory(
            clientTls.sslSocketFactory(),
            clientTls.trustManager,
        ).build()
        val server = MockWebServer()
        server.useHttps(serverTls.sslSocketFactory(), false)
        server.enqueue(
            MockResponse().withWebSocketUpgrade(object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) { }
            }),
        )
        server.start()
        try {
            val transport = CentrifugeRealtime(ApiOrigin(server.url("/").toString()), http)
            val collection = launch(Dispatchers.Default) {
                transport.events(
                    "synthetic-session",
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                ).collect {
                }
            }
            val request =
                withContext(Dispatchers.IO) {
                    checkNotNull(server.takeRequest(5, TimeUnit.SECONDS))
                }
            assertEquals("/api/v1/realtime", request.path)
            assertEquals("Bearer synthetic-session", request.getHeader("Authorization"))
            assertEquals("centrifuge-protobuf", request.getHeader("Sec-WebSocket-Protocol"))
            assertNull(request.requestUrl?.query)
            collection.cancelAndJoin()
            assertFalse(http.dispatcher.executorService.isShutdown)
        } finally {
            server.close()
            http.dispatcher.executorService.shutdown()
            http.connectionPool.evictAll()
        }
    }
}

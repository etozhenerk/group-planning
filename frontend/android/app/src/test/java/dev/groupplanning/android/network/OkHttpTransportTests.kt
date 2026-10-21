package dev.groupplanning.android.network

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.OkHttpTransport
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.support.Fixtures
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.EventListener
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import okhttp3.tls.HandshakeCertificates
import okhttp3.tls.HeldCertificate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OkHttpTransportTests {
    @Test fun redirectsCookiesAndAutomaticRetriesAreDisabled() = runBlocking {
        withServer { server, client ->
            server.enqueue(
                MockResponse().setResponseCode(302).addHeader("Location", "/elsewhere")
                    .addHeader("Set-Cookie", "session=should-not-persist"),
            )
            server.enqueue(
                MockResponse().setHeader("Content-Type", "application/json")
                    .setBody(Fixtures.json("public-invitation")),
            )
            val api = ApiClient(ApiOrigin(server.url("/").toString()), OkHttpTransport(client))
            try {
                api.send(ApiRequest(listOf("probe")), InvitationPreview.serializer())
                error("Expected redirect response")
            } catch (error: ClientFailure) {
                assertEquals(302, error.status)
            }
            assertEquals(1, server.requestCount)
            api.send(ApiRequest(listOf("probe")), InvitationPreview.serializer())
            server.takeRequest()
            assertNull(server.takeRequest().getHeader("Cookie"))
            server.enqueue(MockResponse().setResponseCode(503).addHeader("Retry-After", "0"))
            try {
                api.send(ApiRequest(listOf("probe")), InvitationPreview.serializer())
                error("Expected unavailable")
            } catch (error: ClientFailure) {
                assertEquals(503, error.status)
            }
            assertEquals(3, server.requestCount)
        }
    }

    @Test fun accessErrorsSurviveOversizedAndInterruptedBodies() = runBlocking {
        withServer { server, client ->
            val api = ApiClient(ApiOrigin(server.url("/").toString()), OkHttpTransport(client))
            for (status in listOf(401, 403)) {
                val responses = listOf(
                    MockResponse().setBody("x".repeat(2 * 1024 * 1024 + 1)),
                    MockResponse().setBody("x".repeat(1024))
                        .setSocketPolicy(SocketPolicy.DISCONNECT_DURING_RESPONSE_BODY),
                )
                for (response in responses) {
                    server.enqueue(response.setResponseCode(status))
                    try {
                        api.send(ApiRequest(listOf("probe")), InvitationPreview.serializer())
                        error("Expected access error")
                    } catch (error: ClientFailure) {
                        assertEquals(status, error.status)
                    }
                }
            }
            assertEquals(4, server.requestCount)
        }
    }

    @Test fun coroutineCancellationCancelsRealCall() = runBlocking {
        withServer { server, client ->
            val cancelled = AtomicBoolean(false)
            val observed = client.newBuilder().eventListener(object : EventListener() {
                override fun canceled(call: Call) {
                    cancelled.set(true)
                }
            }).build()
            server.enqueue(MockResponse().setSocketPolicy(SocketPolicy.NO_RESPONSE))
            val api = ApiClient(ApiOrigin(server.url("/").toString()), OkHttpTransport(observed))
            val request =
                launch { api.send(ApiRequest(listOf("probe")), InvitationPreview.serializer()) }
            withContext(Dispatchers.IO) { checkNotNull(server.takeRequest(5, TimeUnit.SECONDS)) }
            request.cancelAndJoin()
            assertTrue(cancelled.get())
            observed.connectionPool.evictAll()
            observed.dispatcher.executorService.shutdown()
        }
    }

    private suspend fun withServer(block: suspend (MockWebServer, OkHttpClient) -> Unit) {
        val certificate = HeldCertificate.Builder().addSubjectAlternativeName("localhost").build()
        val serverTls = HandshakeCertificates.Builder().heldCertificate(certificate).build()
        val clientTls = HandshakeCertificates.Builder().addTrustedCertificate(
            certificate.certificate,
        ).build()
        val server = MockWebServer()
        server.useHttps(serverTls.sslSocketFactory(), false)
        server.start()
        val client = OkHttpClient.Builder().sslSocketFactory(
            clientTls.sslSocketFactory(),
            clientTls.trustManager,
        ).build()
        try {
            block(server, client)
        } finally {
            client.connectionPool.evictAll()
            client.dispatcher.executorService.shutdown()
            server.shutdown()
        }
    }
}

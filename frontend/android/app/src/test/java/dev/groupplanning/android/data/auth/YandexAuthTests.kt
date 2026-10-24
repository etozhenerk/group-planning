package dev.groupplanning.android.data.auth

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.SignInViewModel
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

internal class MemoryAuthAttempts : AuthAttemptStorage {
    var attempt: PendingAuthAttempt? = null
    override fun load(): PendingAuthAttempt? = attempt
    override fun save(attempt: PendingAuthAttempt?) {
        this.attempt = attempt
    }
}

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class YandexAuthTests {
    private val id = "11111111-1111-4111-8111-111111111111"
    private val now = Clock.fixed(Instant.parse("2026-10-24T12:00:00Z"), ZoneOffset.UTC)

    @Test fun homeContextOmitsInvitationToken() {
        val body = checkNotNull(AuthRequests.start(AuthContext(), "c".repeat(43)).body)
        val context = apiJson.parseToJsonElement(
            body,
        ).jsonObject.getValue("return_context").jsonObject
        assertEquals(setOf("kind"), context.keys)
    }

    @Test fun proofMatchesPKCEVector() {
        val proof = AuthProof("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
        assertEquals("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", proof.challenge)
        assertEquals(43, AuthProof.generate().verifier.length)
        assertNotEquals(AuthProof.generate().verifier, AuthProof.generate().verifier)
    }

    @Test fun sdkResultSurvivesRepositoryRecreationAndCannotReplay() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        val storage = MemoryAuthAttempts()
        val api = ApiClient(ApiOrigin("https://example.test"), h.transport)
        val context = AuthContext("invitation", "A".repeat(22))
        h.transport.enqueue("auth/yandex/start", started())
        YandexAuthRepository(api, h.session, storage, dispatcher, now).begin(context)
        val proof = checkNotNull(storage.attempt).verifier
        val startBody = Buffer().also { h.transport.requests.first().body?.writeTo(it) }.readUtf8()
        val json = apiJson.parseToJsonElement(startBody).jsonObject
        assertEquals("android", json.getValue("client_kind").jsonPrimitive.content)
        assertEquals(
            AuthProof(proof).challenge,
            json.getValue("app_challenge").jsonPrimitive.content,
        )
        assertFalse(startBody.contains(proof))
        h.transport.enqueue("auth/mobile/sdk/exchange", exchanged(context))
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        val restored = YandexAuthRepository(api, h.session, storage, dispatcher, now)
        assertEquals(context, restored.complete("sdk-test-token"))
        assertTrue(h.session.state.value.session is SessionState.Authenticated)
        assertNull(storage.attempt)
        assertEquals("native-session", h.storage.credential?.token)
        assertTrue(
            runCatching {
                restored.complete("sdk-test-token")
            }.exceptionOrNull() is ClientFailure,
        )
        assertEquals(3, h.transport.requests.size)
        assertFalse(h.transport.requests.any { it.url.encodedPath.contains("rsvp") })
    }

    @Test fun issuedSessionCanRetryMeAfterNetworkFailure() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        val storage = MemoryAuthAttempts()
        val repo =
            YandexAuthRepository(
                ApiClient(ApiOrigin("https://example.test"), h.transport),
                h.session,
                storage,
                dispatcher,
                now,
            )
        h.transport.enqueue("auth/yandex/start", started())
        repo.begin(AuthContext())
        h.transport.enqueue("auth/mobile/sdk/exchange", exchanged(AuthContext()))
        h.transport.handle("me") { throw ClientFailure(FailureKind.Network) }
        repo.complete("sdk-test-token")
        assertTrue(h.session.state.value.session is SessionState.Failed)
        assertEquals("native-session", h.storage.credential?.token)
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        h.session.restore()
        assertTrue(h.session.state.value.session is SessionState.Authenticated)
    }

    @Test fun cancelAndRepeatedTapDoNotExchangeOrLoseInvitation() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        val storage = MemoryAuthAttempts()
        val repo =
            YandexAuthRepository(
                ApiClient(ApiOrigin("https://example.test"), h.transport),
                h.session,
                storage,
                dispatcher,
                now,
            )
        var completed = false
        val model = SignInViewModel(repo, backgroundScope) { completed = true }
        h.transport.enqueue("auth/yandex/start", started())
        model.start(AuthContext("invitation", "A".repeat(22)))
        model.start(AuthContext())
        runCurrent()
        assertTrue(model.state.value.launchSDK)
        model.launched()
        model.result(null, cancelled = true, ready = null)
        runCurrent()
        assertFalse(model.state.value.busy)
        assertFalse(model.state.value.problem)
        assertFalse(completed)
        assertNull(storage.attempt)
        assertEquals(1, h.transport.requests.size)
    }

    @Test fun sdkResultWaitsForInitialSessionRestoration() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        val storage = MemoryAuthAttempts().apply {
            attempt = PendingAuthAttempt(id, "v".repeat(43), Fixtures.expiry, AuthContext())
        }
        val repo =
            YandexAuthRepository(
                ApiClient(ApiOrigin("https://example.test"), h.transport),
                h.session,
                storage,
                dispatcher,
                now,
            )
        val gate = CompletableDeferred<Unit>()
        val restore = backgroundScope.launch { gate.await() }
        val model = SignInViewModel(repo, backgroundScope) {}
        model.result("sdk-test-token", cancelled = false, ready = restore)
        runCurrent()
        assertTrue(h.transport.requests.isEmpty())
        h.transport.enqueue("auth/mobile/sdk/exchange", exchanged(AuthContext()))
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        gate.complete(Unit)
        runCurrent()
        assertTrue(h.session.state.value.session is SessionState.Authenticated)
        assertFalse(model.state.value.busy)
    }

    private fun started(): String = apiJson.encodeToString(
        AuthRequests.Started(id, "https://oauth.yandex.ru/authorize", Fixtures.expiry),
    )
    private fun exchanged(context: AuthContext): String =
        apiJson.encodeToString(AuthRequests.Session("native-session", Fixtures.expiry, context))
}

package dev.groupplanning.android.session

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.models.InvitationLink
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.session.CredentialStorage
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.data.session.StoredSession
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import dev.groupplanning.android.support.seed
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionTests {
    @Test fun restoreUsesServerProfileAndDoesNotRespondToInvitation() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        assertEquals(
            Fixtures.user,
            (h.session.state.value.session as SessionState.Authenticated).profile,
        )
        assertEquals(listOf("/api/v1/me"), h.transport.requests.map { it.url.encodedPath })
    }

    @Test fun absentOrExpiredCredentialDoesNotContactServer() = runTest {
        for (credential in listOf(
            null,
            StoredSession("expired", ApiInstant("2000-01-01T00:00:00Z")),
        )) {
            val h = SessionHarness(StandardTestDispatcher(testScheduler))
            h.storage.credential = credential
            h.session.restore()
            assertEquals(SessionState.SignedOut, h.session.state.value.session)
            assertNull(h.storage.credential)
            assertTrue(h.transport.requests.isEmpty())
        }
    }

    @Test fun expiredMeCannotAuthenticate() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(
                CurrentSession(Fixtures.user, ApiInstant("2000-01-01T00:00:00Z")),
            ),
        )
        h.session.restore()
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
        assertNull(h.storage.credential)
    }

    @Test fun storageFailureNeverAuthenticates() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        val failed = object : CredentialStorage {
            override fun load(): StoredSession? = throw ClientFailure(FailureKind.Storage)
            override fun save(credential: StoredSession) = Unit
            override fun clear() = Unit
        }
        val session =
            SessionRepository(
                ApiClient(ApiOrigin("https://example.test"), h.transport),
                failed,
                StandardTestDispatcher(testScheduler),
            )
        session.restore()
        assertTrue(session.state.value.session is SessionState.Failed)
        assertTrue(h.transport.requests.isEmpty())
    }

    @Test fun unauthorizedRestoreClearsStoredSecret() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.transport.enqueue("me", "<html>unauthorized</html>", 401, "text/html")
        h.session.restore()
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
        assertNull(h.storage.credential)
    }

    @Test fun unauthorizedRequestClearsAllPrivateDataEvenWithMalformedBody() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.seed()
        h.transport.enqueue("meetings", "malformed", 401, "text/plain")
        h.meetings.loadMeetings()
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
        assertTrue(h.session.state.value.data.details.isEmpty())
        assertTrue(h.session.state.value.data.feeds.isEmpty())
        assertTrue(h.session.state.value.data.participants.isEmpty())
        assertNull(h.storage.credential)
    }

    @Test fun organizerOnlyForbiddenDoesNotRevokeChat() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.seed()
        h.transport.enqueue("meetings/${Fixtures.meetingId}/invitation", status = 403)
        try {
            h.session.authenticated(
                MeetingRequests.invitation(Fixtures.meetingId),
                InvitationLink.serializer(),
            )
            error("Expected forbidden")
        } catch (failure: ClientFailure) {
            assertEquals(403, failure.status)
        }
        assertTrue(h.session.state.value.data.feeds.containsKey(Fixtures.meetingId))
        assertFalse(Fixtures.meetingId in h.session.state.value.data.denied)
        assertTrue(h.session.state.value.session is SessionState.Authenticated)
    }

    @Test fun failedRemoteLogoutStillClearsLocalCredentialsAndCache() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.seed()
        h.transport.enqueue("auth/logout", status = 503)
        try {
            h.session.logout()
            error("Expected failure")
        } catch (failure: ClientFailure) {
            assertEquals(503, failure.status)
        }
        assertNull(h.storage.credential)
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
        assertTrue(h.session.state.value.data.feeds.isEmpty())
    }

    @Test fun newProcessRestoresOnlyCredentialAndVerifiesMeAgain() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        h.login()
        h.seed()
        val recreated =
            SessionRepository(
                ApiClient(ApiOrigin("https://example.test"), h.transport),
                h.storage,
                dispatcher,
            )
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        recreated.restore()
        assertTrue(recreated.state.value.session is SessionState.Authenticated)
        assertTrue(recreated.state.value.data.feeds.isEmpty())
        assertEquals(2, h.transport.requests.count { it.url.encodedPath == "/api/v1/me" })
    }
}

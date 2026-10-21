package dev.groupplanning.android.network

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.requests.FeedRequests
import dev.groupplanning.android.data.api.requests.InvitationRequests
import dev.groupplanning.android.data.session.StoredSession
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.ScriptedTransport
import java.util.UUID
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class ApiClientTests {
    @Test fun requiresHttpsOriginWithoutPathOrCredentials() {
        for (origin in listOf(
            "http://example.test",
            "https://user:pass@example.test",
            "https://example.test/api",
            "https://example.test/?secret=x",
        )) {
            assertThrows(ClientFailure::class.java) { ApiOrigin(origin) }
        }
        assertThrows(ClientFailure::class.java) {
            ApiOrigin("https://example.test").resolve(ApiRequest(listOf("..", "me")))
        }
        assertThrows(IllegalArgumentException::class.java) { InvitationRequests.preview("../me") }
    }

    @Test fun invitationRequestContainsNoBearerByDefault() = runTest {
        val transport = ScriptedTransport()
        transport.enqueue("invitations/" + "A".repeat(22), Fixtures.json("public-invitation"))
        ApiClient(ApiOrigin("https://example.test"), transport).send(
            InvitationRequests.preview("A".repeat(22)),
            InvitationPreview.serializer(),
        )
        assertNull(transport.requests.single().header("Authorization"))
        assertNull(transport.requests.single().header("Cookie"))
    }

    @Test fun messageUsesStableKeyAndExplicitBearer() = runTest {
        val transport = ScriptedTransport()
        val key = UUID.randomUUID()
        val path = "meetings/${Fixtures.meetingId}/messages"
        repeat(2) { transport.enqueue(path, Fixtures.json("late-message-retry"), 201) }
        val api = ApiClient(ApiOrigin("https://example.test"), transport)
        repeat(2) {
            api.send(
                FeedRequests.message(Fixtures.meetingId, "Текст", key),
                FeedEntry.serializer(),
                StoredSession("private-token", Fixtures.expiry),
            )
        }
        for (request in transport.requests) {
            assertEquals(key.toString(), request.header("Idempotency-Key"))
            assertEquals("Bearer private-token", request.header("Authorization"))
            assertNull(request.header("Cookie"))
        }
        assertFalse(
            StoredSession("private-token", Fixtures.expiry).toString().contains("private-token"),
        )
    }

    @Test fun unexpectedSuccessStatusAndContentTypeAreRejected() = runTest {
        for ((status, mime) in listOf(201 to "application/json", 200 to "text/html")) {
            val transport = ScriptedTransport()
            transport.enqueue(
                "invitations/" + "A".repeat(22),
                Fixtures.json("public-invitation"),
                status,
                mime,
            )
            try {
                ApiClient(ApiOrigin("https://example.test"), transport).send(
                    InvitationRequests.preview("A".repeat(22)),
                    InvitationPreview.serializer(),
                )
                error("Expected rejection")
            } catch (failure: ClientFailure) {
                assertEquals(
                    if (status ==
                        200
                    ) {
                        FailureKind.InvalidResponse
                    } else {
                        FailureKind.Http
                    },
                    failure.kind,
                )
            }
        }
    }

    @Test fun paginationRejectsConflictingCursorsAndEncodesOpaqueQuery() {
        assertThrows(IllegalArgumentException::class.java) {
            FeedRequests.page(Fixtures.meetingId, limit = 101)
        }
        val url = ApiOrigin("https://example.test").resolve(
            ApiRequest(
                listOf("meetings"),
                query = mapOf(
                    "cursor" to "a/b?c&d",
                ),
            ),
        )
        assertEquals("a/b?c&d", url.queryParameter("cursor"))
        assertEquals(1, url.querySize)
    }
}

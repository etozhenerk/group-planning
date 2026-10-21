package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.links.InvitationContext
import dev.groupplanning.android.data.links.InvitationLinks
import dev.groupplanning.android.data.links.InvitationStorage
import dev.groupplanning.android.data.links.InvitationTarget
import java.util.Base64
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class InvitationLinksTests {
    private val short = "QUFBQUFBQUFBQUFBQUFBQQ"
    private val links =
        InvitationLinks(ApiOrigin("https://example.test:8443"), "group-planning-android")

    @Test fun acceptsCanonicalShortLegacyAndCustomLinks() {
        val legacy = Base64.getUrlEncoder().withoutPadding().encodeToString(ByteArray(32) { 65 })
        for (token in listOf(short, legacy)) {
            for (path in listOf("i", "invitations")) {
                assertEquals(token, links.parse("https://example.test:8443/$path/$token")?.value)
                assertEquals(token, links.parse("group-planning-android://$path/$token")?.value)
            }
        }
        assertTrue(links.shareable("https://example.test:8443/i/$short"))
        assertFalse(links.shareable("group-planning-android://i/$short"))
    }

    @Test fun rejectsForeignOriginsCallbacksMalformedAndNonCanonicalTokens() {
        for (value in listOf(
            "https://example.test/i/$short",
            "http://example.test:8443/i/$short",
            "https://other.test:8443/i/$short",
            "https://user@example.test:8443/i/$short",
            "https://example.test:8443/i/$short?next=somewhere",
            "https://example.test:8443/i/$short#fragment",
            "https://example.test:8443/i/$short/",
            "https://example.test:8443/i/%51UFBQUFBQUFBQUFBQUFBQQ",
            "group-planning-android://auth/callback", "group-planning-android-qa://i/$short",
            "group-planning-android://i/QUFBQUFBQUFBQUFBQUFBQR", "not a URI",
        )) {
            assertNull(value, links.parse(value))
        }
    }

    @Test fun contextSurvivesNewOwnerAndExplicitCloseClearsIt() = runTest {
        val storage = object : InvitationStorage {
            var token: String? = null
            override fun load(): String? = token
            override fun save(token: String?) {
                this.token = token
            }
        }
        val dispatcher = StandardTestDispatcher(testScheduler)
        InvitationContext(storage, dispatcher).save(InvitationTarget.Token(short))
        val reopened = InvitationContext(storage, dispatcher)
        assertEquals(short, reopened.load()?.value)
        reopened.save(null)
        assertNull(InvitationContext(storage, dispatcher).load())
        assertFalse(InvitationTarget.Token(short).toString().contains(short))
    }
}

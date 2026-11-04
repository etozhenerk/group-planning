package dev.groupplanning.android

import android.net.Uri
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.json.JSONObject
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class NativeEmptyInviteUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun systemOnlyChatKeepsInviteUntilAnotherParticipantSendsFirstMessage() {
        val api = ChatReadLiveApi(fixture.context)
        val created = api.request(
            "empty",
            "meetings",
            "POST",
            JSONObject().put("title", "Проверка пустого приглашения")
                .put("starts_on", "2099-01-01").put("timezone", "Europe/Moscow"),
        )
        val id = created.getJSONObject("meeting").getString("id")
        val token = checkNotNull(Uri.parse(created.getString("invitation_url")).lastPathSegment)
        val peer = "review-reader-1"
        val preview = api.request(peer, "invitations/$token")
        api.request(
            peer,
            "invitations/$token/rsvp",
            "PUT",
            JSONObject().put("answer", "going")
                .put("expected_revision", preview.getString("my_rsvp_revision")),
        )
        val entries = api.request("empty", "meetings/$id/feed").getJSONArray("entries")
        assertTrue(entries.length() > 0)
        for (index in 0 until entries.length()) {
            assertFalse(entries.getJSONObject(index).getString("kind") == "message")
        }
        fixture.launch("empty").use {
            fixture.waitTag("meeting-$id")
            compose.onNodeWithTag("meeting-$id").performScrollTo().performClick()
            val prompt = fixture.context.getString(R.string.invite_prompt)
            val invite = fixture.context.getString(R.string.invite_friends)
            val share = fixture.context.getString(R.string.invitation_share)
            fixture.waitText(prompt)
            compose.onNodeWithContentDescription(share).assertDoesNotExist()
            compose.onAllNodesWithText(invite).assertCountEquals(1)
            fixture.screenshot("native-empty-system-only")
            compose.onNodeWithTag("message-composer").performClick()
                .performTextInput("Позову друзей позже")
            compose.onNodeWithText(invite).performScrollTo().performClick()
            assertTrue(
                fixture.device.wait(Until.hasObject(By.pkg("com.android.intentresolver")), 10_000),
            )
            fixture.screenshot("native-empty-direct-share")
            fixture.device.pressBack()
            fixture.waitText(prompt)
            compose.onNodeWithContentDescription(share).assertDoesNotExist()
            compose.onNodeWithTag("message-composer").assertTextContains("Позову друзей позже")
            val message = "Первое сообщение другого участника"
            api.message(peer, id, message)
            fixture.waitText(message)
            compose.onNodeWithText(prompt).assertDoesNotExist()
            compose.onNodeWithContentDescription(share).assertExists()
            compose.onNodeWithTag("message-composer").assertTextContains("Позову друзей позже")
            fixture.screenshot("native-empty-replaced-by-message")
        }
    }
}

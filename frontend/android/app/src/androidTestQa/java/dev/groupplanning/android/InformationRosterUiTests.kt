package dev.groupplanning.android

import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class InformationRosterUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = qaCreateEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val meeting = "deb00000-0000-4000-8000-000000000002"
    private val revisions = mutableMapOf<String, String>()

    @Before fun configure() = fixture.configure()

    @Test fun mixedResponsesAndOtherActorUpdateKeepMeetingOnlyContent() {
        val api = ChatReadLiveApi(fixture.context)
        try {
            repeat(20) {
                api.message(
                    "review-reader-4",
                    meeting,
                    "История $it\nПроверка положения под составом",
                )
            }
            answer(api, "1", "maybe")
            answer(api, "2", "not_going")
            fixture.launch("design").use {
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("message-composer")
                compose.onNodeWithTag("message-composer").performTextInput("Черновик под составом")
                val anchor = compose.onNodeWithText("Я принесу настолки. Во что будем играть?")
                compose.onNodeWithTag("feed-timeline").performScrollToNode(
                    hasText("Я принесу настолки. Во что будем играть?"),
                )
                anchor.assertIsDisplayed()
                val top = anchor.fetchSemanticsNode().boundsInRoot.top
                openInformation(4)
                compose.onNodeWithTag(
                    "participants-more",
                    useUnmergedTree = true,
                ).assertTextContains("+1")
                assertNoServiceLinks()
                fixture.screenshot("information-current-four")
                expandAndCheckAll()
                compose.onNodeWithTag("participants-collapse").performScrollTo().performClick()
                compose.onNodeWithTag("participants-expand").assertIsFocused()
                answer(api, "4", "maybe")
                fixture.closeActionSheet()
                fixture.waitAbsent("chat-action-sheet")
                openInformation(3)
                compose.onNodeWithTag(
                    "participants-more",
                    useUnmergedTree = true,
                ).assertDoesNotExist()
                expandAndCheckAll()
                compose.onAllNodes(hasTestTag("participant-roster-row")).assertCountEquals(6)
                fixture.screenshot("information-current-three-full-six")
                fixture.closeActionSheet()
                fixture.waitAbsent("chat-action-sheet")
                compose.onNodeWithTag(
                    "message-composer",
                ).assertTextContains("Черновик под составом")
                assertTrue(
                    kotlin.math.abs(anchor.fetchSemanticsNode().boundsInRoot.top - top) <=
                        2 * compose.density.density,
                )
            }
        } finally {
            for (person in listOf("4", "2", "1")) answer(api, person, "going")
        }
    }

    private fun answer(api: ChatReadLiveApi, person: String, value: String) {
        val actor = "review-reader-$person"
        val revision = revisions[actor] ?: api.request(actor, "meetings/$meeting")
            .getString("my_rsvp_revision")
        val response = api.request(
            actor,
            "meetings/$meeting/rsvp",
            "PUT",
            JSONObject().put("answer", value).put("expected_revision", revision),
        )
        revisions[actor] = response.getString("rsvp_revision")
    }

    private fun openInformation(count: Int) {
        compose.onNodeWithTag("meeting-heading").performClick()
        fixture.waitTag("meeting-information")
        val label = fixture.context.getString(R.string.participants_show_all, count)
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasContentDescription(label)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("participants-expand").assert(hasContentDescription(label))
        compose.onAllNodes(hasTestTag("participant-name-chip"), useUnmergedTree = true)
            .assertCountEquals(3)
    }

    private fun expandAndCheckAll() {
        compose.onNodeWithTag("participants-expand").performClick()
        compose.onNodeWithTag("participants-collapse").assertIsFocused()
        compose.onAllNodes(hasTestTag("participant-roster-row")).assertCountEquals(6)
        compose.onNodeWithTag("participants-collapse").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("sasha@example.com").assertDoesNotExist()
        assertNoServiceLinks()
    }

    private fun assertNoServiceLinks() {
        for (label in listOf(
            "Помощь",
            "Сообщить о проблеме",
            "Предложить идею",
            "О приложении",
            "Политика конфиденциальности",
            "Cookie и хранение",
        )) {
            compose.onNodeWithText(label).assertDoesNotExist()
        }
    }
}

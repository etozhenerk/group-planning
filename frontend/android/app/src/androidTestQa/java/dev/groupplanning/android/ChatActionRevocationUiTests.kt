package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ChatActionRevocationUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun serverWithdrawalFromAnotherDeviceClosesOpenSheetAndClearsPrivateDraft() {
        val otherDevice = SecondDeviceRsvp(fixture, "invite-rsvp")
        try {
            // Each test starts with its own required RSVP, even after a prior case failed.
            otherDevice.respond(fixture.token, RsvpAnswer.NotGoing)
            fixture.launch("invite-rsvp", fixture.token).use {
                join()
                compose.onNodeWithContentDescription(
                    fixture.context.getString(R.string.meeting_information),
                ).performClick()
                fixture.waitTag("meeting-information")
                compose.onNodeWithTag("information-share").assertDoesNotExist()
                fixture.closeActionSheet()
                fixture.waitAbsent("chat-action-sheet")
                openTask()
                compose.onNodeWithTag("preparation-title")
                    .performTextInput("Черновик до отзыва доступа")
                val withdrawal = otherDevice.respond(fixture.token, RsvpAnswer.NotGoing)
                assertFalse(withdrawal.canAccessFeed)
                fixture.waitAbsent("chat-action-sheet")
                fixture.waitAbsent("message-composer")
                compose.onNodeWithTag("preparation-title").assertDoesNotExist()
                fixture.waitTag("rsvp-NotGoing")
                compose.waitUntil(15_000) {
                    compose.onNodeWithTag("rsvp-NotGoing").fetchSemanticsNode()
                        .config[SemanticsProperties.Selected]
                }
                fixture.screenshot("sheet-access-revoked")
                join()
                openTask()
                assertEquals(
                    "",
                    compose.onNodeWithTag("preparation-title").fetchSemanticsNode()
                        .config[SemanticsProperties.EditableText].text,
                )
                fixture.screenshot("sheet-new-draft-after-rejoining")
                fixture.closeActionSheet()
            }
        } finally {
            otherDevice.respond(fixture.token, RsvpAnswer.NotGoing)
        }
    }

    private fun join() {
        fixture.waitText(fixture.context.getString(R.string.rsvp_going))
        compose.onNodeWithTag("rsvp-Going").performClick()
        fixture.waitTag("meeting-add")
    }

    private fun openTask() {
        compose.onNodeWithTag("meeting-add").performClick()
        compose.onNodeWithTag("new-preparation-task").performClick()
        fixture.waitTag("preparation-title")
    }
}

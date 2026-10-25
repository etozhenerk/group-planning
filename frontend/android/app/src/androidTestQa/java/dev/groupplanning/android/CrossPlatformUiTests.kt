package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test

class CrossPlatformUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Test fun readSharedCoverJoinAndSend() {
        fixture.configure()
        val token = checkNotNull(
            InstrumentationRegistry.getArguments().getString("crossToken"),
        )
        fixture.launch("invite-error", token).use {
            fixture.waitText("Встреча трёх платформ")
            fixture.waitTag("meeting-cover")
            compose.onNodeWithTag("meeting-cover").performScrollTo().assertIsDisplayed()
            fixture.screenshot("cross-android-cover")
            compose.onNodeWithText("Приду").performScrollTo().performClick()
            compose.onNodeWithTag("rsvp-save").performScrollTo().performClick()
            fixture.waitText("Hello from web")
            fixture.waitText("Hello from iOS")
            compose.onNodeWithTag("message-composer").performTextInput("Hello from Android")
            compose.onNodeWithTag("message-send").performClick()
            fixture.waitText("Hello from Android")
            fixture.screenshot("cross-android-messages")
        }
    }
}

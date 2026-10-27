package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class CrossPlatformUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

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
            compose.onNodeWithTag("feed-timeline").performScrollToNode(hasText("rules.txt"))
            compose.onNodeWithText("rules.txt").assertIsDisplayed()
            compose.onNodeWithText("Правила встречи от web").assertIsDisplayed()
            fixture.screenshot("cross-android-attachment")
            compose.onNodeWithTag("feed-timeline").performScrollToNode(
                hasContentDescription(fixture.context.getString(R.string.experience_photo)),
            )
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.experience_photo),
            ).assertIsDisplayed()
            compose.onNodeWithTag("feed-timeline").performScrollToNode(hasText("Hello from web"))
            fixture.waitText("❤️ 1")
            compose.onNodeWithText("Hello from web").performTouchInput { longClick() }
            fixture.waitText("👍")
            compose.onNodeWithText("👍").performClick()
            fixture.waitText("👍 1 ✓")
            fixture.screenshot("cross-android-reactions")
            compose.onNodeWithTag("message-composer").performTextInput("Hello from Android")
            compose.onNodeWithTag("message-send").performClick()
            fixture.waitText("Hello from Android")
            fixture.screenshot("cross-android-messages")
            fixture.device.pressBack()
            compose.onNodeWithContentDescription("Мои встречи").performClick()
            fixture.waitText("Прошедшие")
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitText("Вайб трёх платформ")
            compose.onNodeWithText("Вайб трёх платформ").performScrollTo().performClick()
            fixture.waitText("Открыть вайб")
            compose.onNodeWithText("Открыть вайб").performClick()
            fixture.waitText("1 / 1")
            waitImage("memory-gallery")
            fixture.screenshot("cross-android-album")
            compose.onNodeWithTag("photo-stack").performClick()
            fixture.waitTag("memory-fullscreen")
            waitImage("memory-viewer")
            fixture.screenshot("cross-android-fullscreen")
        }
    }

    private fun waitImage(parent: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(
                SemanticsMatcher("Loaded private image") { node ->
                    node.config.getOrElse(SemanticsProperties.TestTag) { "" }
                        .startsWith("media-image-")
                } and hasAnyAncestor(hasTestTag(parent)),
                useUnmergedTree = true,
            ).fetchSemanticsNodes().isNotEmpty()
        }
    }
}

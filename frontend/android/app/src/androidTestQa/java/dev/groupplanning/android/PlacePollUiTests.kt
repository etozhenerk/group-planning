package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class PlacePollUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    private fun open(suffix: String) {
        val tag = "meeting-d3c60000-0000-4000-8000-000000000$suffix"
        fixture.waitTag(tag)
        compose.onNodeWithTag(tag).performClick()
        fixture.waitTag("meeting-add")
    }

    @Test fun createRetryAndRevoteWithoutEarlyPlaceChange() {
        fixture.launch("place-owner").use {
            open("100")
            compose.onNodeWithTag("meeting-add").performClick()
            compose.onNodeWithTag("new-place-poll").performClick()
            fixture.waitTag("place-poll-place")
            compose.onNodeWithTag("place-poll-place").performTextInput("Кафе у парка")
            compose.onNodeWithTag("place-poll-explanation").performScrollTo()
                .performTextInput("Есть стол на всех и тихий зал")
            fixture.device.pressBack()
            compose.onNodeWithTag("place-poll-create").performScrollTo().performClick()
            fixture.waitTag("place-poll-error")
            compose.onNodeWithTag("place-poll-place").assertTextContains("Кафе у парка")
            fixture.screenshot("android-place-create-error")
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("chat-action-sheet")
            compose.onNodeWithTag("meeting-add").performClick()
            compose.onNodeWithTag("new-place-poll").performClick()
            fixture.waitTag("place-poll-error")
            compose.onNodeWithTag("place-poll-place").assertTextContains("Кафе у парка")
            compose.onNodeWithTag("place-poll-explanation")
                .assertTextContains("Есть стол на всех и тихий зал")
            compose.onNodeWithTag("place-poll-create").performScrollTo().performClick()
            fixture.waitTag("place-vote-for")
            compose.onNodeWithText("Есть стол на всех и тихий зал").assertExists()
            compose.onNodeWithTag("place-vote-for").performClick()
            fixture.waitTag("place-poll-error")
            compose.onNodeWithText("Ваш голос: За").assertDoesNotExist()
            fixture.screenshot("android-place-vote-error")
            compose.onNodeWithText("Повторить").performClick()
            fixture.waitText("Ваш голос: За")
            compose.onNodeWithTag("place-vote-against").performClick()
            fixture.waitText("Ваш голос: Против")
            compose.waitUntil(5000) {
                runCatching { compose.onNodeWithTag("place-vote-for").assertIsEnabled() }.isSuccess
            }
            fixture.screenshot("android-place-vote")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitText("У Саши")
            compose.onNodeWithText("У Саши").assertIsDisplayed()
        }
    }

    @Test fun overdueResultRefreshesMeetingDetails() {
        fixture.launch("place-close").use {
            open("200")
            fixture.waitText("Место изменено")
            compose.onNodeWithTag("place-vote-for").assertDoesNotExist()
            fixture.screenshot("android-place-applied")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitText("Кафе у парка")
            fixture.screenshot("android-place-details")
        }
    }

    @Test fun cancelledAndRejectedAtLargeText() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("place-cancelled").use {
                open("400")
                fixture.waitText("Опрос отменён: организатор изменил место")
                compose.onNodeWithTag("place-vote-for").assertDoesNotExist()
                compose.onNodeWithTag("feed-timeline").performScrollToNode(hasText("Кафе у парка"))
                fixture.screenshot("android-place-large-cancelled")
                fixture.device.pressBack()
                fixture.waitTag("meeting-d3c60000-0000-4000-8000-000000000400")
            }
        } finally {
            if (original == "null") {
                fixture.shell("settings delete system font_scale")
            } else {
                require(original.toFloatOrNull() != null)
                fixture.shell("settings put system font_scale $original")
            }
        }
        fixture.launch("place-rejected").use {
            open("300")
            fixture.waitText("Место осталось прежним")
            compose.onNodeWithTag("place-vote-for").assertDoesNotExist()
            fixture.screenshot("android-place-rejected")
        }
    }
}

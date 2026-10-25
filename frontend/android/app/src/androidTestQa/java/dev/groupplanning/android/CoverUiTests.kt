package dev.groupplanning.android

import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class CoverUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }
    private fun form() {
        fixture.waitText("С чего начнём?")
        compose.onNodeWithText("Создать встречу").performScrollTo().performClick()
        fixture.waitTag("create-form")
        compose.onNodeWithContentDescription("Название").performTextInput("Встреча с обложкой")
        fixture.device.pressBack()
        compose.onNodeWithContentDescription("Дата").performScrollTo().performClick()
        compose.onNodeWithTag("date-confirm").performClick()
        compose.onNodeWithText("Обложка").performScrollTo().performClick()
        compose.onNodeWithTag("cover-select").performScrollTo()
    }

    @Test fun selectionReadFailureCancellationAndLostResponseKeepPhotoAndForm() {
        fixture.launch("cover-create").use { activity ->
            form()
            compose.onNodeWithTag("cover-select").performClick()
            fixture.waitTag("meeting-cover")
            compose.onNodeWithTag("cover-select").performScrollTo().performClick()
            fixture.waitTag("cover-error")
            compose.onNodeWithTag("meeting-cover").assertExists()
            fixture.screenshot("android-cover-read-error")
            compose.onNodeWithTag("cover-select").performScrollTo().performClick()
            compose.waitUntil(10_000) {
                compose.onAllNodes(hasTestTag("cover-loading")).fetchSemanticsNodes().isEmpty()
            }
            compose.onNodeWithTag("meeting-cover").assertExists()
            compose.onNodeWithTag("create-submit").performScrollTo().performClick()
            fixture.waitText("Повторить сохранение")
            compose.onNodeWithTag("cover-select").assertIsNotEnabled()
            fixture.screenshot("android-cover-create-retry")
            activity.recreate()
            fixture.waitText("Повторить сохранение")
            compose.onNodeWithContentDescription(
                "Название",
            ).assertTextContains("Встреча с обложкой")
            compose.onNodeWithTag("create-submit").performScrollTo().performClick()
            fixture.waitTag("feed-timeline")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("meeting-cover")
            fixture.screenshot("android-cover-details")
        }
    }

    @Test fun replacementAndRemovalUseConfirmedServerPhoto() {
        fixture.launch("cover-edit").use {
            val card = "meeting-c0fe0000-0000-4000-8000-000000000100"
            fixture.waitTag(card)
            compose.waitUntil(10_000) {
                compose.onAllNodes(hasTestTag("meeting-cover"), useUnmergedTree = true)
                    .fetchSemanticsNodes().isNotEmpty()
            }
            fixture.screenshot("android-cover-list")
            compose.onNodeWithTag(card).performClick()
            fixture.waitTag("feed-timeline")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("open-settings")
            compose.onNodeWithTag("open-settings").performScrollTo().performClick()
            fixture.waitTag("meeting-settings")
            compose.onNodeWithTag("cover-select").performScrollTo().performClick()
            compose.waitUntil(10_000) {
                compose.onAllNodes(hasTestTag("cover-loading")).fetchSemanticsNodes().isEmpty()
            }
            compose.onNodeWithTag("settings-save").performScrollTo().performClick()
            fixture.waitTag("feed-timeline")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("open-settings")
            fixture.screenshot("android-cover-replaced")
            compose.onNodeWithTag("open-settings").performScrollTo().performClick()
            fixture.waitTag("meeting-settings")
            compose.onNodeWithTag("cover-remove").performScrollTo().performClick()
            compose.onNodeWithTag("meeting-cover").assertDoesNotExist()
            compose.onNodeWithTag("settings-save").performScrollTo().performClick()
            fixture.waitTag("feed-timeline")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("open-settings")
            compose.onNodeWithTag("meeting-cover").assertDoesNotExist()
        }
    }

    @Test fun largeTextAndSystemPickerBackKeepDraft() {
        val scale = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("cover-large").use {
                form()
                compose.onNodeWithTag("cover-select").performClick()
                fixture.waitTag("meeting-cover")
                compose.onNodeWithTag("cover-remove").performScrollTo()
                fixture.screenshot("android-cover-large")
                compose.onNodeWithTag("cover-remove").performClick()
                compose.onNodeWithTag("meeting-cover").assertDoesNotExist()
            }
        } finally {
            fixture.shell("settings put system font_scale $scale")
        }
        fixture.launch("cover-system").use {
            form()
            compose.onNodeWithTag("cover-select").performClick()
            fixture.device.waitForIdle(2_000)
            assertFalse(fixture.device.currentPackageName == fixture.context.packageName)
            fixture.screenshot("android-cover-system-picker")
            fixture.device.pressBack()
            fixture.waitTag("cover-select")
            assertTrue(fixture.device.currentPackageName == fixture.context.packageName)
            compose.onNodeWithTag("meeting-cover").assertDoesNotExist()
            compose.onNodeWithContentDescription(
                "Название",
            ).assertTextContains("Встреча с обложкой")
        }
    }
}

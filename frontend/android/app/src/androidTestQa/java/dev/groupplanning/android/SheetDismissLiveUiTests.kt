package dev.groupplanning.android

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class SheetDismissLiveUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun swipeAndBackKeepDraftWithoutRefreshingMeetingContent() {
        fixture.launch("design").use {
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            fixture.waitTag("meeting-add")
            compose.waitUntil(15_000) { QaChatProbe.signals.contains("meeting:Subscribed") }
            compose.waitUntil(5_000) {
                val last = QaChatProbe.events.lastOrNull()?.substringBefore(' ')?.toLongOrNull()
                last != null && android.os.SystemClock.elapsedRealtime() - last >= 1_000
            }
            openTask()
            compose.onNodeWithTag("preparation-title").performClick()
                .performTextReplacement("Сохранённый черновик")
            fixture.device.pressBack()
            fixture.screenshot("sheet-no-x-draft")
            val before = reads()
            assertTrue("The fixture must observe real meeting reads", before.isNotEmpty())
            compose.onNodeWithTag("action-sheet-content").performTouchInput {
                swipeDown(startY = 1f, endY = height.toFloat() - 1f)
            }
            fixture.waitAbsent("chat-action-sheet")
            fixture.screenshot("sheet-swipe-return-no-refresh")
            assertEquals(before, reads())
            openTask()
            compose.onNodeWithTag("preparation-title").assertTextContains("Сохранённый черновик")
            val reopened = reads()
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            fixture.screenshot("sheet-back-return-no-refresh")
            assertEquals(reopened, reads())
            checkDirtyGuard()
        }
    }

    private fun checkDirtyGuard() {
        compose.onNodeWithTag("meeting-heading").performClick()
        compose.onNodeWithTag("open-settings").performScrollTo().performClick()
        fixture.waitTag("meeting-settings")
        val title = compose.onNodeWithContentDescription(
            fixture.context.getString(R.string.meeting_title_field),
        )
        title.performScrollTo().performTextReplacement("Незаконченные настройки")
        fixture.device.pressBack()
        val before = reads()
        compose.onNodeWithTag("action-sheet-content").performTouchInput {
            swipeDown(startY = 1f, endY = height.toFloat() - 1f)
        }
        fixture.waitText(fixture.context.getString(R.string.discard_settings_title))
        assertEquals(before, reads())
        compose.onNodeWithText(fixture.context.getString(R.string.keep_editing)).performClick()
        title.assertTextContains("Незаконченные настройки")
        fixture.screenshot("dirty-before-back")
        fixture.closeActionSheet()
        fixture.screenshot("dirty-after-back")
        fixture.waitText(fixture.context.getString(R.string.discard_settings_title))
        compose.onNodeWithText(fixture.context.getString(R.string.discard_settings)).performClick()
        fixture.waitTag("meeting-information")
        assertEquals(before, reads())
        fixture.closeActionSheet()
        fixture.waitAbsent("chat-action-sheet")
    }

    private fun openTask() {
        compose.onNodeWithTag("meeting-add").performClick()
        compose.onNodeWithTag("new-preparation-task").performClick()
        fixture.waitTag("preparation-title")
        compose.onNodeWithTag("close-action-sheet").assertDoesNotExist()
    }

    private fun reads() = QaChatProbe.requests.filter {
        val request = it.substringBefore(" (cursor")
        request.startsWith("GET ") &&
            (
                request.endsWith("/feed") ||
                    request.endsWith("/sync") ||
                    request.endsWith("/participants") ||
                    request.matches(Regex("GET /api/v1/meetings/[a-f0-9-]+"))
                )
    }
}

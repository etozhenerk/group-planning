package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeRight
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class AlbumPreloadFailureUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @After fun cleanup() {
        QaResponseGate.unavailableGetPath = null
        QaResponseGate.unavailableMediaPrefix = null
    }

    @Test fun failedPhotoKeepsPreparedNeighboursAndRetriesBeforeRevocation() {
        val id = "deb00000-0000-4000-8000-000000000004"
        val api = ChatReadLiveApi(fixture.context)
        val photos = api.request("design", "meetings/$id/memories").getJSONArray("photos")
        assertEquals(3, photos.length())
        val failedId = photos.getJSONObject(1).getString("id")
        QaResponseGate.unavailableGetPath = "/api/v1/meetings/$id/media/$failedId/content"
        QaChatProbe.reset()
        fixture.launch("design").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitText("Суббота без спешки")
            compose.onNodeWithText("Суббота без спешки").performScrollTo().performClick()
            fixture.waitText("Открыть вайб")
            compose.onNodeWithText("Открыть вайб").performClick()
            fixture.waitText("1 / 3")
            compose.waitUntil(15_000) {
                QaChatProbe.requests.filter { it.endsWith("/content") }.toSet().size == 3
            }
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("Не удалось загрузить. Повторить")
            fixture.waitText("1 / 3")
            fixture.screenshot("preload-failed-next-keeps-first")
            QaResponseGate.unavailableMediaPrefix = "/api/v1/meetings/"
            val before = cachedRequests(failedId)
            compose.onNodeWithContentDescription("Все фото").performClick()
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.memories_count, 3, 3),
            ).performTouchInput { click() }
            fixture.waitTag("memory-fullscreen")
            compose.onNodeWithText("3 / 3", substring = true).assertIsDisplayed()
            compose.onNodeWithTag("media-image-${photos.getJSONObject(2).getString("id")}")
                .assertIsDisplayed()
            assertEquals(before, cachedRequests(failedId))
            fixture.screenshot("preload-third-available-offline")
            fixture.device.pressBack()
            fixture.device.pressBack()
            fixture.waitTag("photo-stack")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
            fixture.waitText("1 / 3")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("Не удалось загрузить. Повторить")
            QaResponseGate.unavailableGetPath = null
            QaResponseGate.unavailableMediaPrefix = null
            compose.onNode(
                hasText("Не удалось загрузить. Повторить") and
                    hasAnyAncestor(hasTestTag("photo-stack")),
            ).performClick()
            fixture.waitText("2 / 3")
            compose.onNode(
                hasTestTag("media-image-$failedId") and
                    hasAnyAncestor(hasTestTag("photo-stack")),
                useUnmergedTree = true,
            ).assertIsDisplayed()
            compose.onNode(
                hasText("Не удалось загрузить. Повторить") and
                    hasAnyAncestor(hasTestTag("photo-stack")),
            ).assertDoesNotExist()
            fixture.screenshot("preload-failed-photo-retried")
            api.request("design", "me", "DELETE")
            fixture.device.pressBack()
            fixture.waitTag("onboarding")
            compose.onNodeWithTag("photo-stack").assertDoesNotExist()
            compose.onNodeWithTag("album-save").assertDoesNotExist()
            fixture.screenshot("preload-failure-cache-revoked")
        }
    }

    private fun cachedRequests(failedId: String): List<String> = QaChatProbe.requests.filter {
        it.endsWith("/content") && !it.contains(failedId)
    }
}

package dev.groupplanning.android

import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.captureToImage
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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class AlbumOfflineSweepUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @After fun cleanup() {
        QaResponseGate.unavailableMediaPrefix = null
    }

    @Test fun everyPreparedPhotoRemainsVisibleAcrossBothOfflineSwipeDirections() {
        QaChatProbe.reset()
        fixture.launch("album-preload-owner").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitText("Суббота у озера")
            compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
            fixture.waitText("Открыть вайб")
            compose.onNodeWithText("Открыть вайб").performClick()
            fixture.waitText("1 / 103")
            compose.waitUntil(30_000) { contentRequests().toSet().size == 103 }
            Thread.sleep(1_000)
            val before = contentRequests()
            QaResponseGate.unavailableMediaPrefix = "/api/v1/meetings/"
            val signatures = mutableListOf<Int>()
            for (number in 1..103) {
                if (number > 1) {
                    compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
                }
                fixture.waitText("$number / 103")
                Thread.sleep(350)
                val value = sample()
                assertTrue("Photo must replace the blank card", ((value shr 8) and 255) in 135..165)
                signatures.add(value)
                println("OFFLINE_SWEEP direction=left index=$number rgb=$value")
                if (number in listOf(1, 52, 103)) fixture.screenshot("offline-left-$number")
            }
            assertEquals(
                "Every distinct fixture photo must be rendered",
                103,
                signatures.toSet().size,
            )
            for (number in 1..103) {
                compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
                fixture.waitText("$number / 103")
                Thread.sleep(350)
                val value = sample()
                for (shift in listOf(0, 8, 16)) {
                    val actual = (value shr shift) and 255
                    val expected = (signatures[number - 1] shr shift) and 255
                    assertTrue(kotlin.math.abs(actual - expected) <= 2)
                }
                println("OFFLINE_SWEEP direction=right index=$number rgb=$value")
                if (number in listOf(1, 52, 103)) fixture.screenshot("offline-right-$number")
            }
            assertEquals(before, contentRequests())
            compose.onNodeWithText("Не удалось загрузить. Повторить").assertDoesNotExist()
            println("OFFLINE_SWEEP photos=103 directions=2 extraContentRequests=0")
        }
    }

    private fun sample(): Int {
        val image = compose.onNodeWithTag("photo-stack").captureToImage()
        return image.toPixelMap()[image.width / 2, image.height / 2].toArgb() and 0xffffff
    }

    private fun contentRequests(): List<String> =
        QaChatProbe.requests.filter { it.endsWith("/content") }
}

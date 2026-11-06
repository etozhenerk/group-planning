package dev.groupplanning.android

import android.animation.ValueAnimator
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import dev.groupplanning.android.ui.theme.DesignTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class CommonNavigationUiTests {
    @get:Rule(order = 0)
    val appLocale: org.junit.rules.TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun movingTabsReducedMotionProfileBackAndCoverFirst() {
        val original = fixture.shell("settings get global animator_duration_scale").trim()
        try {
            fixture.shell("settings put global animator_duration_scale 1")
            fixture.launch("design").use {
                fixture.waitText("Ужин в пятницу")
                compose.waitUntil(5_000) { ValueAnimator.areAnimatorsEnabled() }
                val destination = verifyMotion()
                fixture.shell("settings put global animator_duration_scale 0")
                compose.waitUntil(5_000) { !ValueAnimator.areAnimatorsEnabled() }
                compose.mainClock.autoAdvance = false
                compose.onNodeWithTag("home-profile").performClick()
                compose.mainClock.advanceTimeBy(64)
                compose.onNodeWithTag("home-profile").assertIsSelected()
                assertEquals(destination, indicatorCenter(), 2f)
                compose.mainClock.autoAdvance = true
                fixture.screenshot("common-tabs-reduced-profile")
                compose.onNodeWithText("О приложении").performScrollTo().performClick()
                fixture.waitText("Android")
                fixture.screenshot("common-about")
                fixture.device.pressBack()
                fixture.waitAbsent("service-page")
                compose.onNodeWithTag("home-profile").assertIsSelected()
                compose.onNodeWithText("Помощь").performScrollTo().performClick()
                fixture.waitTag("service-page")
                compose.waitUntil(10_000) {
                    compose.onAllNodes(
                        hasText(fixture.context.getString(R.string.help_title)) and
                            hasAnyAncestor(hasTestTag("service-page")),
                    ).fetchSemanticsNodes().isNotEmpty()
                }
                fixture.device.pressBack()
                fixture.waitAbsent("service-page")
                compose.onNodeWithTag("home-profile").assertIsSelected()
                compose.onNodeWithText("Выйти из аккаунта").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText("Удалить аккаунт").assertDoesNotExist()
                compose.onNodeWithText("Версия", substring = true).assertDoesNotExist()
                fixture.screenshot("common-profile-logout-bottom")
                compose.onNodeWithTag("home-meetings").performClick()
                compose.onNodeWithContentDescription("Создать встречу").performClick()
                fixture.waitTag("cover-select")
                val cover = compose.onNodeWithTag("cover-select")
                cover.assertIsDisplayed()
                val title = compose.onNodeWithContentDescription("Название")
                assertTrue(
                    cover.fetchSemanticsNode().boundsInRoot.bottom <
                        title.fetchSemanticsNode().boundsInRoot.top,
                )
                compose.onNodeWithTag("home-navigation").assertDoesNotExist()
                fixture.screenshot("common-create-cover-first")
            }
        } finally {
            compose.mainClock.autoAdvance = true
            fixture.shell(
                if (original == "null") {
                    "settings delete global animator_duration_scale"
                } else {
                    "settings put global animator_duration_scale $original"
                },
            )
            assertEquals(
                original,
                fixture.shell("settings get global animator_duration_scale").trim(),
            )
        }
    }

    private fun verifyMotion(): Float {
        compose.mainClock.autoAdvance = false
        try {
            val initial = indicatorCenter()
            compose.onNodeWithTag("home-profile").performClick()
            compose.mainClock.advanceTimeBy(80)
            val moving = indicatorCenter()
            assertTrue("Indicator must move between tabs", moving > initial + 5)
            val output = androidx.test.platform.app.InstrumentationRegistry.getArguments()
                .getString("additionalTestOutputDir")!!
            val frame = java.io.File(output, "common-tabs-mid-transition.png")
            frame.parentFile!!.mkdirs()
            check(fixture.device.takeScreenshot(frame))
            compose.mainClock.advanceTimeBy(400)
            val destination = indicatorCenter()
            assertTrue(
                "The intermediate frame must precede its destination",
                moving < destination - 5,
            )
            compose.onNodeWithTag("home-profile").assertIsSelected()
            println("NAVIGATION_PIXELS initial=$initial moving=$moving destination=$destination")
            compose.onNodeWithTag("home-meetings").performClick()
            compose.mainClock.advanceTimeBy(400)
            assertEquals(initial, indicatorCenter(), 2f)
            compose.onNodeWithTag("home-meetings").assertIsSelected()
            return destination
        } finally {
            compose.mainClock.autoAdvance = true
        }
    }

    private fun indicatorCenter(): Float {
        val image = compose.onNodeWithTag("home-navigation").captureToImage()
        val output = androidx.test.platform.app.InstrumentationRegistry.getArguments()
            .getString("additionalTestOutputDir")!!
        java.io.File(output).mkdirs()
        java.io.File(output, "indicator-${compose.mainClock.currentTime}.png").outputStream().use {
            image.asAndroidBitmap().compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        val pixels = image.toPixelMap()
        val target = DesignTokens.colorNavigationSelected
        val matches = (0 until pixels.width).filter { x ->
            val color = pixels[x, pixels.height / 2]
            color.red in (target.red - .02f)..(target.red + .14f) &&
                color.blue in (target.blue - .02f)..(target.blue + .14f) &&
                color.blue - color.red > .02f &&
                color.red - color.green > .005f
        }
        assertTrue(
            "Selected indicator must be visible at ${compose.mainClock.currentTime} (${pixels.width}x${pixels.height})",
            matches.size > 10,
        )
        return matches.average().toFloat()
    }
}

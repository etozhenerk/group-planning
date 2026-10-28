package dev.groupplanning.android

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeUp
import androidx.test.core.app.ActivityScenario
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ExperienceUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun albumSwipeGridAndRecreationKeepTheSelectedPhoto() {
        fixture.launch("memories").use { activity ->
            fixture.waitTag("meetings-list")
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitText("Суббота у озера")
            compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
            fixture.waitText("Открыть вайб")
            compose.onNodeWithText("Открыть вайб").performClick()
            fixture.waitText("1 / 3")
            fixture.screenshot("refresh-memory-stack")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("2 / 3")
            compose.onNodeWithTag("memory-fullscreen").assertDoesNotExist()
            activity.recreate()
            fixture.waitText("2 / 3")
            compose.onNodeWithContentDescription("Все фото").performClick()
            fixture.screenshot("refresh-memory-grid")
            fixture.device.pressBack()
            fixture.waitText("2 / 3")
            verifyAccessibleGallery(activity)
        }
    }

    private fun verifyAccessibleGallery(activity: ActivityScenario<MainActivity>) {
        val scale = fixture.shell("settings get system font_scale").trim()
        val animation = fixture.shell("settings get global animator_duration_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.shell("settings put global animator_duration_scale 0")
            activity.onActivity {
                it.requestedOrientation =
                    ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }
            compose.waitUntil(10_000) {
                var ready = false
                activity.onActivity {
                    val configuration = it.resources.configuration
                    ready = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE &&
                        kotlin.math.abs(configuration.fontScale - 1.8f) < .01f
                }
                ready
            }
            fixture.waitText("2 / 3")
            val actions = compose.onNodeWithTag("photo-stack").fetchSemanticsNode()
                .config[SemanticsActions.CustomActions]
            compose.runOnIdle {
                check(
                    actions.single {
                        it.label == fixture.context.getString(R.string.photo_next)
                    }.action(),
                )
            }
            fixture.waitText("3 / 3")
            revealGalleryControl(compose.onNodeWithContentDescription("Все фото"))
            compose.onNodeWithText("3 / 3").assertIsDisplayed()
            fixture.screenshot("refresh-memory-landscape-large-no-motion")
            compose.onNodeWithContentDescription("Все фото").performClick()
            val firstPhoto = fixture.context.getString(R.string.memories_count, 1, 3)
            compose.waitUntil(10_000) {
                compose.onAllNodes(
                    hasContentDescription(firstPhoto),
                ).fetchSemanticsNodes().isNotEmpty()
            }
            compose.onNodeWithContentDescription(firstPhoto).assertIsDisplayed()
            fixture.screenshot("refresh-memory-landscape-large-grid")
        } finally {
            activity.onActivity {
                it.requestedOrientation =
                    ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            }
            if (scale == "null") {
                fixture.shell("settings delete system font_scale")
            } else {
                require(scale.toFloatOrNull() != null)
                fixture.shell("settings put system font_scale $scale")
            }
            if (animation ==
                "null"
            ) {
                fixture.shell("settings delete global animator_duration_scale")
            } else {
                require(animation.toFloatOrNull() != null)
                fixture.shell("settings put global animator_duration_scale $animation")
            }
        }
    }

    private fun revealGalleryControl(control: SemanticsNodeInteraction) {
        repeat(8) {
            try {
                control.assertIsDisplayed()
                return
            } catch (_: AssertionError) {
                compose.onNodeWithTag("memory-gallery").performTouchInput {
                    swipeUp(startY = height * .85f, endY = height * .15f)
                }
            }
        }
        control.assertIsDisplayed()
    }

    @Test fun profileSupportDraftAndNavigationSurviveRecreation() {
        fixture.launch("calendar").use { activity ->
            fixture.waitText("Киновечер")
            fixture.screenshot("refresh-meeting-cards")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
            fixture.screenshot("refresh-profile")
            compose.onNodeWithText("Сообщить о проблеме").performScrollTo()
                .performSemanticsAction(SemanticsActions.OnClick) { it() }
            fixture.waitTag("support-description")
            compose.onNodeWithTag("support-description")
                .performTextInput("Проверка формы обращения из Android QA")
            activity.recreate()
            fixture.waitTag("support-description")
            compose.onNodeWithTag("support-description")
                .assertTextContains("Проверка формы обращения из Android QA")
            fixture.screenshot("refresh-support-restored")
            compose.onNodeWithText("Отправить обращение").performScrollTo()
                .performSemanticsAction(SemanticsActions.OnClick) { it() }
            fixture.waitText("Спасибо, что рассказали")
            fixture.screenshot("refresh-support-success")
            compose.onNodeWithText("Мои встречи").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-invitations").performClick()
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            compose.onNodeWithText(fixture.context.getString(R.string.invitations_description))
                .assertIsDisplayed()
            fixture.screenshot("refresh-invitations")
        }
    }
}

package dev.groupplanning.android

import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontSynthesis
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.time.LocalDate
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

@OptIn(ExperimentalTestApi::class)
class SavedInvitationsUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val card = "saved-invitation-22222222-2222-4222-8222-222222222222"

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun confirmedResponsesMoveInvitationAndFailedSaveKeepsAnswer() {
        fixture.launch("saved-invitations").use {
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitTag(card)
            fixture.screenshot("android-saved-invitations")
            compose.onNodeWithTag(card).performClick()
            fixture.waitTag("rsvp-Maybe")
            respond("Приду")
            fixture.waitText(
                "Сохранение не подтверждено. Повторите запрос.",
            )
            compose.onNodeWithTag("rsvp-Maybe").assertIsSelected()
            compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0)
            fixture.screenshot("android-saved-response-error")
            compose.onNodeWithTag("rsvp-Going").performClick()
            fixture.waitTag("invitation-conversation")
            fixture.device.pressBack()
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitText("Приглашений пока нет")
            compose.onNodeWithTag("home-meetings").performClick()
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performClick()
            fixture.waitTag("invitation-conversation")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("invitation-people")
            respond("Возможно")
            fixture.waitTag(card)
            compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0)
            compose.onNodeWithTag(card).performClick()
            fixture.waitTag("rsvp-Maybe")
            respond("Не смогу")
            fixture.waitTag("rsvp-declined")
            fixture.waitText("Вы ответили «Не смогу»")
            compose.onNodeWithText("Организатор увидит ваш ответ.").assertIsDisplayed()
            compose.onNodeWithText("К моим встречам").performScrollTo().performClick()
            fixture.waitTag("home-meetings")
            compose.onAllNodesWithText("Настолки у Саши").assertCountEquals(0)
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitText("Приглашений пока нет")
            fixture.screenshot("android-saved-empty")
        }
    }

    @Test fun listErrorRetryLargeTextAndBack() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("saved-error").use {
                fixture.waitTag("home-invitations")
                compose.onNodeWithTag("home-invitations").performClick()
                fixture.waitText("Не удалось загрузить приглашения")
                fixture.screenshot("android-saved-list-error")
                compose.onNodeWithText("Повторить загрузку").performScrollTo().performClick()
                fixture.waitTag(card)
                compose.onNodeWithTag(card).assertIsDisplayed()
                val layouts = mutableListOf<TextLayoutResult>()
                compose.onNodeWithTag("invitations-heading").performSemanticsAction(
                    SemanticsActions.GetTextLayoutResult,
                ) { it(layouts) }
                val headingLayout = layouts.single()
                println(
                    "SAVED_HEADING_LAYOUT size=${headingLayout.size} " +
                        "widthOverflow=${headingLayout.didOverflowWidth} " +
                        "heightOverflow=${headingLayout.didOverflowHeight}",
                )
                fixture.screenshot("android-saved-before-layout-assert")
                assertFalse(headingLayout.hasVisualOverflow)
                fixture.screenshot("android-saved-large-text")
                val author = compose.onNodeWithText(
                    "Приглашает Саша",
                    useUnmergedTree = true,
                )
                author.performScrollTo()
                val complete = author.getUnclippedBoundsInRoot()
                val visible = author.fetchSemanticsNode().boundsInRoot
                val viewport = compose.onNodeWithTag("saved-invitations-list")
                    .fetchSemanticsNode().boundsInRoot
                println(
                    "SAVED_AUTHOR_BOUNDS complete=$complete visible=$visible viewport=$viewport",
                )
                fixture.screenshot("android-saved-author-bounds")
                assertEquals(
                    "inviter text is vertically clipped at font1.8",
                    with(compose.density) { (complete.bottom - complete.top).toPx() },
                    visible.height,
                    1f,
                )
                val authorLayouts = mutableListOf<TextLayoutResult>()
                author.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                    it(authorLayouts)
                }
                val authorLayout = authorLayouts.single()
                val style = authorLayout.layoutInput.style
                val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    typeface = authorLayout.layoutInput.fontFamilyResolver.resolve(
                        style.fontFamily,
                        style.fontWeight ?: FontWeight.Normal,
                        style.fontStyle ?: FontStyle.Normal,
                        style.fontSynthesis ?: FontSynthesis.All,
                    ).value as Typeface
                    textSize = with(compose.density) { style.fontSize.toPx() }
                }
                val inkBounds = Rect()
                val label = authorLayout.layoutInput.text.text
                paint.getTextBounds(label, 0, label.length, inkBounds)
                val pixels = author.captureToImage().toPixelMap()
                val inkColor = style.color
                val inkRows = (0 until pixels.height).filter { y ->
                    (0 until pixels.width).any { x ->
                        val pixel = pixels[x, y]
                        abs(pixel.red - inkColor.red) < .02f &&
                            abs(pixel.green - inkColor.green) < .02f &&
                            abs(pixel.blue - inkColor.blue) < .02f
                    }
                }
                assertTrue("caption contains no rendered glyph ink", inkRows.isNotEmpty())
                val baseline = authorLayout.getLineBaseline(0)
                val expectedTop = baseline + inkBounds.top
                val expectedBottom = baseline + inkBounds.bottom - 1
                println(
                    "SAVED_AUTHOR_INK actual=${inkRows.first()}..${inkRows.last()} " +
                        "expected=$expectedTop..$expectedBottom baseline=$baseline " +
                        "fontPx=${paint.textSize} fontBounds=$inkBounds",
                )
                assertTrue("caption glyph top clipped", inkRows.first() <= expectedTop + 2)
                assertTrue("caption glyph bottom clipped", inkRows.last() >= expectedBottom - 2)
                compose.onNodeWithTag(card).performClick()
                fixture.waitTag("rsvp-Maybe")
                fixture.device.pressBack()
                fixture.waitTag(card)
            }
        } finally {
            if (original == "null") {
                fixture.shell("settings delete system font_scale")
            } else {
                require(original.toFloatOrNull() != null)
                fixture.shell("settings put system font_scale $original")
            }
        }
    }

    @Test fun emptyInvitationsPreserveCalendarDayAndSelectedTabAfterRecreation() {
        fixture.launch("saved-empty").use { activity ->
            fixture.waitText("Нет предстоящих встреч")
            compose.onNodeWithTag("meeting-display-toggle").performClick()
            val day = "day-${LocalDate.now().withDayOfMonth(15)}"
            fixture.waitTag(day)
            compose.onNodeWithTag(day).performClick()
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitText("Приглашений пока нет")
            compose.onAllNodesWithContentDescription("Создать встречу").assertCountEquals(0)
            activity.recreate()
            fixture.waitText("Приглашений пока нет")
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            compose.onNodeWithTag("home-meetings").performClick()
            fixture.waitTag(day)
            compose.onNodeWithTag(day).assertIsSelected()
        }
    }

    private fun respond(answer: String) {
        val public = compose.onAllNodesWithTag(
            "rsvp-${when (answer) {
                "Приду" -> "Going"
                "Возможно" -> "Maybe"
                else -> "NotGoing"
            }}",
        ).fetchSemanticsNodes().isNotEmpty()
        val action = compose.onNode(hasText(answer) and hasClickAction())
        if (!public) action.performScrollTo()
        action.performClick()
    }
}

package dev.groupplanning.android

import android.graphics.Bitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class CalendarUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun calendarAndListPreservePeriodDayAndBack() {
        fixture.launch("calendar").use { activity ->
            fixture.waitText("Киновечер")
            compose.onNodeWithText("Календарь").performClick()
            fixture.waitTag("day-2026-10-31")
            compose.onNodeWithTag("day-2026-10-31").assertIsSelected()
            screenshot("calendar-android")
            compose.onNodeWithTag("meetings-list").performScrollToNode(hasText("Поздний ужин"))
            compose.onNodeWithText("Поздний ужин").assertIsDisplayed()
            compose.onNodeWithContentDescription("Создать встречу").assertIsDisplayed()
            compose.onAllNodesWithContentDescription("Создать встречу").assertCountEquals(1)
            screenshot("calendar-android-scrolled")
            compose.onNodeWithText("Киновечер").performScrollTo().performClick()
            fixture.waitTag("message-composer")
            fixture.device.pressBack()
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("meetings-list").performScrollToIndex(0)
            compose.onNodeWithTag("day-2026-10-31").assertIsSelected()
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitTag("day-2026-09-20")
            compose.onNodeWithTag("day-2026-09-20").assertIsSelected()
            compose.onNodeWithText("Список").performClick()
            fixture.waitText("Прошлая встреча")
            compose.onNodeWithText("Календарь").performClick()
            fixture.waitTag("day-2026-09-20")
            compose.onNodeWithContentDescription("Следующий месяц").performClick()
            fixture.waitTag("day-2026-10-20")
            compose.onNodeWithTag("day-2026-10-20").assertIsSelected()
            activity.recreate()
            fixture.waitTag("day-2026-10-20")
            compose.onNodeWithTag("day-2026-10-20").assertIsSelected()
            compose.onNodeWithText("Сегодня").performClick()
            compose.onNodeWithTag("day-${LocalDate.now()}").assertIsSelected()
            compose.onNodeWithText("Прошедшие").assertIsSelected()
            compose.onNodeWithTag("meetings-list").performScrollToNode(hasText("Без даты · 1"))
            compose.onNodeWithText("Без даты · 1").performClick()
            fixture.waitText("Поход")
            screenshot("calendar-android-undated")
        }
    }

    @Test fun emptyCalendarKeepsOneFullWidthHeadingAndPrefillsDate() {
        fixture.launch("calendar-empty").use {
            fixture.waitText("С чего начнём?")
            compose.onNodeWithText("Календарь").performClick()
            fixture.waitTag("day-${LocalDate.now()}")
            val selected = LocalDate.now().withDayOfMonth(25)
            compose.onNodeWithTag("day-$selected").performClick()
            val heading = compose.onNodeWithTag(
                "meetings-heading",
            ).fetchSemanticsNode().boundsInRoot
            val list = compose.onNodeWithTag("meetings-list").fetchSemanticsNode().boundsInRoot
            assertEquals(0f, heading.left, 1f)
            assertEquals(list.width, heading.width, 1f)
            val button = compose.onNodeWithContentDescription("Создать встречу")
            val before = button.fetchSemanticsNode().boundsInRoot
            compose.onNodeWithTag(
                "meetings-list",
            ).performScrollToNode(hasText("На этот день встреч нет."))
            button.assertIsDisplayed()
            assertEquals(before.top, button.fetchSemanticsNode().boundsInRoot.top, 1f)
            compose.onAllNodesWithContentDescription("Создать встречу").assertCountEquals(1)
            screenshot("calendar-android-empty-sticky")
            button.performClick()
            fixture.waitTag("create-form")
            compose.onNodeWithContentDescription("Дата").performScrollTo().assertTextContains(
                selected.format(DateTimeFormatter.ofPattern("dd.MM.yyyy")),
            )
            compose.onNodeWithContentDescription("Время").performScrollTo()
                .assertTextContains("Выберите время")
            screenshot("calendar-android-prefilled")
        }
    }

    @Test fun largeTextKeepsSevenColumnsAndControlsReachable() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("calendar-large").use {
                fixture.waitText("Киновечер")
                compose.onNodeWithText("Календарь").performClick()
                fixture.waitTag("day-2026-10-31")
                for (label in listOf("Предстоящие", "Прошедшие", "Календарь")) {
                    val layouts = mutableListOf<TextLayoutResult>()
                    compose.onNodeWithText(label, useUnmergedTree = true).performSemanticsAction(
                        SemanticsActions.GetTextLayoutResult,
                    ) { it(layouts) }
                    assertEquals(1, layouts.single().lineCount)
                }
                screenshot("calendar-android-large-controls")
                compose.onNodeWithTag(
                    "meetings-list",
                ).performScrollToNode(hasTestTag("day-2026-10-05"))
                val bounds = compose.onNodeWithTag(
                    "meetings-list",
                ).fetchSemanticsNode().boundsInRoot
                for (day in 5..11) {
                    val tag = "day-2026-10-${day.toString().padStart(2, '0')}"
                    val cell = compose.onNodeWithTag(tag).fetchSemanticsNode().boundsInRoot
                    assertTrue(
                        cell.width > 0 && cell.left >= bounds.left && cell.right <= bounds.right,
                    )
                }
                compose.onNodeWithContentDescription("Создать встречу").assertIsDisplayed()
                screenshot("calendar-android-large")
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
    private fun screenshot(name: String) {
        compose.waitForIdle()
        val directory = File(
            checkNotNull(
                InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
            ),
        ).apply { check(mkdirs() || isDirectory) }
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(directory, "$name.png").outputStream().use {
            check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
    }
}

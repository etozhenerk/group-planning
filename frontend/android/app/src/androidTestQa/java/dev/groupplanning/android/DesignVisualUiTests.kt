package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.ViewModelProvider
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class DesignVisualUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun approvedDesignScreens() {
        fixture.launch("design").use { activity ->
            fixture.waitText("Ужин в пятницу")
            compose.waitUntil(15_000) {
                compose.onAllNodes(hasTestTag("meeting-cover"), useUnmergedTree = true)
                    .fetchSemanticsNodes().size >= 2
            }
            compose.onNodeWithTag("home-navigation").assertExists()
            fixture.screenshot("design-list")
            compose.onNodeWithText("Календарь").performClick()
            fixture.waitTag("day-2026-10-30")
            fixture.screenshot("design-calendar")
            compose.onNodeWithText("Список").performClick()
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("sasha@example.com")
            fixture.screenshot("design-profile")
            compose.onNodeWithText("23 декабря").performScrollTo().assertExists()
            compose.onNodeWithText("Александр").assertExists()
            compose.onNodeWithText("Иванов").assertExists()
            compose.onNodeWithText("Мужской").assertExists()
            fixture.screenshot("design-profile-personal")
            compose.onNodeWithText("Сообщить о проблеме").performScrollTo()
                .performSemanticsAction(SemanticsActions.OnClick) { it() }
            fixture.waitTag("support-description")
            compose.onAllNodes(
                hasTestTag("home-navigation") and hasAnyAncestor(hasTestTag("service-page")),
            ).assertCountEquals(0)
            fixture.screenshot("design-report")
            fixture.device.pressBack()
            fixture.waitAbsent("service-page")
            compose.onNodeWithText("О приложении").performScrollTo()
                .performSemanticsAction(SemanticsActions.OnClick) { it() }
            fixture.waitText("Android")
            fixture.screenshot("design-about")
            fixture.device.pressBack()
            fixture.waitAbsent("service-page")
            compose.onNodeWithText("Помощь").performScrollTo()
                .performSemanticsAction(SemanticsActions.OnClick) { it() }
            fixture.waitText(fixture.context.getString(R.string.help_heading))
            fixture.screenshot("design-help")
            fixture.device.pressBack()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitText(fixture.context.getString(R.string.invitations_description))
            fixture.screenshot("design-invitations")
            compose.onNodeWithTag("home-meetings").performClick()
            compose.onNodeWithContentDescription("Создать встречу").performClick()
            fixture.waitTag("create-form")
            activity.onActivity {
                val app = ViewModelProvider(it)[AppViewModel::class.java]
                (app.route.value as AppRoute.Create).model.change { draft ->
                    draft.copy(day = "2026-10-30", time = "20:00")
                }
            }
            compose.onNodeWithTag("home-navigation").assertDoesNotExist()
            fixture.screenshot("design-create")
            fixture.device.pressBack()
            compose.onNodeWithText(fixture.context.getString(R.string.create_save_close))
                .performClick()
            fixture.waitText("Ужин в пятницу")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            fixture.waitTag("message-composer")
            compose.onNodeWithTag("home-navigation").assertDoesNotExist()
            fixture.screenshot("design-chat")
            compose.onNodeWithTag("meeting-add").performClick()
            fixture.waitTag("new-date-poll")
            fixture.screenshot("design-chat-menu")
            listOf(
                Triple("new-date-poll", "poll-create", "action-date"),
                Triple("new-place-poll", "place-poll-place", "action-place"),
                Triple("new-preparation-task", "preparation-title", "action-task"),
            ).forEachIndexed { index, (action, field, screenshot) ->
                if (index > 0) compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag(action).performClick()
                fixture.waitTag(field)
                compose.onNodeWithTag("chat-action-sheet").assertIsDisplayed()
                compose.onNodeWithText(fixture.context.getString(R.string.experience_back))
                    .assertDoesNotExist()
                if (field == "preparation-title") {
                    compose.onNodeWithTag(field).performTextInput("Заказать пиццу")
                    compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
                    fixture.screenshot("design-action-task-keyboard")
                    fixture.device.pressBack()
                }
                compose.onNodeWithTag("home-navigation").assertDoesNotExist()
                fixture.screenshot("design-$screenshot")
                if (field == "place-poll-place") {
                    compose.onNodeWithTag(field).performTextInput("Кафе у парка")
                    compose.onNodeWithTag("place-poll-explanation").performTextInput("Тихий зал")
                    compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
                    fixture.screenshot("design-action-place-keyboard")
                    fixture.device.pressBack()
                }
                val selectedSetting = if (action == "new-date-poll") {
                    val toggle = compose.onNodeWithContentDescription("Можно изменить голос")
                    toggle.performScrollTo().performClick()
                    toggle.fetchSemanticsNode().config[SemanticsProperties.ToggleableState]
                } else {
                    null
                }
                activity.recreate()
                fixture.waitTag(field)
                fixture.device.pressBack()
                fixture.waitTag("meeting-add")
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag(action).performClick()
                fixture.waitTag(field)
                when (field) {
                    "preparation-title" -> compose.onNodeWithTag(
                        field,
                    ).assertTextContains("Заказать пиццу")
                    "place-poll-place" -> {
                        compose.onNodeWithTag(field).assertTextContains("Кафе у парка")
                        compose.onNodeWithTag(
                            "place-poll-explanation",
                        ).assertTextContains("Тихий зал")
                    }
                    else -> assertEquals(
                        selectedSetting,
                        compose.onNodeWithContentDescription(
                            "Можно изменить голос",
                        ).fetchSemanticsNode()
                            .config[SemanticsProperties.ToggleableState],
                    )
                }
                fixture.device.pressBack()
                fixture.waitTag("meeting-add")
            }
            compose.onNodeWithTag("emoji-open").performClick()
            fixture.waitTag("emoji-search")
            fixture.screenshot("design-chat-emoji")
            compose.onNodeWithTag("emoji-search").performTextInput("вишня")
            fixture.waitText("🍒")
            compose.onNodeWithText("🍒").performClick()
            compose.onNodeWithTag("message-composer").assertTextContains("🍒")
            compose.onNodeWithContentDescription("Мои встречи").performClick()
            fixture.waitText("Прошедшие")
            compose.onNodeWithText("Прошедшие").performClick()
            fixture.waitText("Суббота без спешки")
            compose.onNodeWithText("Суббота без спешки").performScrollTo().performClick()
            fixture.waitText("Открыть вайб")
            compose.onNodeWithText("Открыть вайб").performClick()
            fixture.waitText("1 / 3")
            compose.waitUntil(15_000) {
                compose.onAllNodes(
                    SemanticsMatcher("Loaded album image") { node ->
                        node.config.getOrElse(SemanticsProperties.TestTag) { "" }
                            .startsWith("media-image-")
                    } and hasAnyAncestor(hasTestTag("memory-gallery")),
                    useUnmergedTree = true,
                ).fetchSemanticsNodes().size >= 3
            }
            compose.onNodeWithTag("home-navigation").assertDoesNotExist()
            fixture.screenshot("design-album")
            compose.onNodeWithContentDescription("Все фото").performClick()
            fixture.screenshot("design-album-grid")
            fixture.device.pressBack()
            compose.onNodeWithTag("photo-stack").performClick()
            fixture.waitTag("memory-viewer")
            compose.waitUntil(15_000) {
                compose.onAllNodes(
                    SemanticsMatcher("Loaded fullscreen image") { node ->
                        node.config.getOrElse(SemanticsProperties.TestTag) { "" }
                            .startsWith("media-image-")
                    } and hasAnyAncestor(hasTestTag("memory-viewer")),
                    useUnmergedTree = true,
                ).fetchSemanticsNodes().isNotEmpty()
            }
            fixture.screenshot("design-album-fullscreen")
            fixture.device.pressBack()
            fixture.waitText("1 / 3")
        }
    }
}

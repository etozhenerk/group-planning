package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.text.TextLayoutResult
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.repository.ResourcePhase
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** Independent QA artifact; never copied into application/canonical source. */
class IndependentR12TailTests {
    @get:Rule(order = 0) val locale: org.junit.rules.TestRule = QaAppLocaleRule()
    @get:Rule(order = 1) val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private lateinit var api: ChatReadLiveApi
    private val output get() = File(checkNotNull(
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
    )).apply { mkdirs() }
    private val actions = JSONArray()

    @Before fun configure() {
        fixture.configure()
        api = ChatReadLiveApi(fixture.context)
        QaClientTestState.begin(fixture.context)
    }
    private fun model(a: ActivityScenario<MainActivity>): AppViewModel {
        lateinit var value: AppViewModel
        a.onActivity { value = ViewModelProvider(it)[AppViewModel::class.java] }
        return value
    }
    private fun log(action: String) {
        actions.put(JSONObject().put("at", Instant.now().toString()).put("action", action))
    }
    private fun save(name: String, value: JSONObject) {
        File(output, "$name.json").writeText(value.toString(2))
    }
    private fun capture(name: String) {
        fixture.screenshot(name)
        File(output, "$name.semantics.txt").writeText(
            compose.onAllNodes(isRoot(), useUnmergedTree = true).printToString(maxDepth = 100),
        )
        fixture.device.dumpWindowHierarchy(File(output, "$name.window.xml"))
        save("$name.interaction", JSONObject().put("at", Instant.now().toString())
            .put("actions", JSONArray(actions.toString())))
    }

    @Test fun cachedNewDayUsesCompactRefreshError() {
        repeat(51) { index ->
            api.request("design", "meetings", "POST", JSONObject()
                .put("title", "Насыщенный день tail ${index + 1}")
                .put("timezone", "Europe/Moscow")
                .put("starts_at", LocalDate.now().plusDays(3).atTime(20, 0)
                    .atZone(ZoneId.of("Europe/Moscow")).format(
                        java.time.format.DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ssXXX"))))
        }
        try {
            fixture.launch("design").use { a ->
                fixture.waitTag("meetings-list")
                val m = model(a)
                compose.onNodeWithTag("meeting-display-toggle").performClick()
                compose.waitUntil(15000) {
                    val c = m.snapshot.value.data.calendar
                    val s = checkNotNull(m.calendar).selection.value
                    s.selectedDay != null && c.request == null && c.filter == s.filter &&
                        c.pageFor(s.filter) != null
                }
                val day = LocalDate.now().plusDays(1)
                QaResponseGate.unavailableGetPath = "/api/v1/meetings"
                compose.onNodeWithTag("day-$day").performClick()
                compose.waitUntil(15000) {
                    val c = m.snapshot.value.data.calendar
                    c.request == null && c.error != null
                }
                val c = m.snapshot.value.data.calendar
                val selected = checkNotNull(m.calendar).selection.value
                assertNotNull(c.counts)
                assertNull(c.pageFor(selected.filter))
                assertTrue(c.cachedPages.values.any { it.nextCursor != null })
                compose.onNodeWithTag("day-$day").assertIsSelected()
                compose.onNodeWithTag("meetings-list")
                    .performScrollToNode(hasText("Не удалось обновить встречи"))
                compose.onNodeWithText("Не удалось обновить встречи").assertIsDisplayed()
                compose.onAllNodesWithText("Не удалось загрузить встречи").assertCountEquals(0)
                compose.onNodeWithContentDescription("Повторить обновление").assertIsDisplayed()
                log("Real51records/monthcursor; newday error keeps selected grid and compact refresh")
                save("cached-newday", JSONObject().put("day", day.toString())
                    .put("countsAvailable", true).put("pageAvailable", false)
                    .put("monthHasCursor", true))
                capture("cached-newday-compact-error")
                QaResponseGate.unavailableGetPath = null
                compose.onNodeWithContentDescription("Повторить обновление").performClick()
                compose.waitUntil(15000) {
                    m.snapshot.value.data.calendar.let { it.request == null && it.error == null }
                }
                assertEquals(selected, checkNotNull(m.calendar).selection.value)
                log("Actual compact retry recovers same day/month/period")
                capture("cached-newday-recovered")
            }
        } finally { QaResponseGate.unavailableGetPath = null }
    }

    @Test fun settledRosterErrorHasNeutralCardAndOwnRetry() {
        val id = UUID.fromString("deb00000-0000-4000-8000-000000000002")
        try {
            for ((name, scale) in listOf("normal" to "1.0", "large" to "1.8")) {
                fixture.shell("wm size 720x1600")
                fixture.shell("settings put system font_scale $scale")
                QaClientTestState.begin(fixture.context)
                fixture.launch("design").use { a ->
                    fixture.waitTag("meetings-list")
                    compose.waitUntil(15000) { model(a).snapshot.value.data.calendar.let {
                        it.request == null && it.page != null
                    } }
                    compose.onNodeWithTag("meetings-list")
                        .performScrollToNode(hasTestTag("meeting-$id"))
                    compose.onNodeWithTag("meeting-$id").performClick()
                    fixture.waitTag("message-composer")
                    val m = model(a)
                    compose.waitUntil(15000) { (m.route.value as AppRoute.Invitation)
                        .model.state.value.loading.not() }
                    QaResponseGate.unavailableGetPath = "/api/v1/meetings/$id/participants"
                    compose.onNodeWithContentDescription("Информация о встрече").performClick()
                    fixture.waitText("Не удалось получить ответы.")
                    compose.onNodeWithText("Повторить").performScrollTo().assertIsDisplayed()
                    val error = compose.onNodeWithText("Не удалось получить ответы.",
                        useUnmergedTree = true)
                    error.assertIsDisplayed()
                    val layouts = mutableListOf<TextLayoutResult>()
                    error.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                        it(layouts)
                    }
                    assertEquals(13f, layouts.single().layoutInput.style.fontSize.value, .01f)
                    assertEquals(20f, layouts.single().layoutInput.style.lineHeight.value, .01f)
                    log("$name real participantsGET error; settled card+ownretry,13/20, font=$scale")
                    capture("roster-error-$name")
                    QaResponseGate.unavailableGetPath = null
                    compose.onNodeWithText("Повторить").performClick()
                    compose.waitUntil(15000) {
                        m.snapshot.value.data.participants[id]?.phase == ResourcePhase.Ready
                    }
                    compose.onNodeWithText("Кто придёт").performScrollTo().assertIsDisplayed()
                    log("$name own participants retry recovered; Info remains open")
                    capture("roster-recovered-$name")
                }
            }
        } finally {
            QaResponseGate.unavailableGetPath = null
            fixture.shell("wm size reset")
            fixture.shell("settings put system font_scale 1.0")
        }
    }
}

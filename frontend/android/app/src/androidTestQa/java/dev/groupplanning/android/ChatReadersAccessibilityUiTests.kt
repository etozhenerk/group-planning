package dev.groupplanning.android

import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTouchInput
import androidx.test.filters.SdkSuppress
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.util.UUID
import kotlin.math.abs
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ChatReadersAccessibilityUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test
    @SdkSuppress(minSdkVersion = 36)
    fun twoReadersErrorRetryAndTalkBackDismissPreserveTheSourceRow() {
        val scale = fixture.shell("settings get system font_scale").trim()
        val meeting = "deb00000-0000-4000-8000-000000000002"
        val api = ChatReadLiveApi(fixture.context)
        val text = "Читатели " + UUID.randomUUID().toString().take(6)
        val sent = api.message("design", meeting, text)
        val sequence = sent.getString("sequence")
        val path = "meetings/$meeting/messages/${sent.getString("id")}/readers"
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("design").use { activity ->
                fixture.waitTag("meetings-list")
                compose.onNodeWithTag("meetings-list").performScrollToNode(
                    hasTestTag("meeting-$meeting"),
                )
                compose.onNodeWithTag("meeting-$meeting").performClick()
                fixture.waitText(text)
                val row = compose.onNodeWithTag("feed-entry-$sequence")
                val before = row.fetchSemanticsNode().boundsInWindow.top
                QaResponseGate.unavailableGetPath = "/api/v1/$path"
                row.performTouchInput { longClick() }
                fixture.waitTag("chat-read-context")
                compose.onNodeWithTag("chat-read-context").performClick()
                fixture.waitText("Не удалось загрузить список")
                val body = compose.onNodeWithTag("action-sheet-content")
                val errorBounds = body.fetchSemanticsNode().boundsInWindow
                fixture.screenshot("readers-large-error")
                QaResponseGate.unavailableGetPath = null
                compose.onNodeWithTag("chat-readers-retry").performClick()
                fixture.waitText("Пока никто не прочитал")
                val emptyBounds = body.fetchSemanticsNode().boundsInWindow
                assertTrue(abs(emptyBounds.top - errorBounds.top) <= compose.density.density)
                assertTrue(abs(emptyBounds.height - errorBounds.height) <= compose.density.density)
                fixture.screenshot("readers-large-empty")
                fixture.device.pressBack()
                fixture.waitAbsent("chat-readers")
                assertTrue(
                    abs(row.fetchSemanticsNode().boundsInWindow.top - before) <=
                        2 * compose.density.density,
                )
                for (actor in listOf("review-reader-1", "review-reader-2")) {
                    api.request(
                        actor,
                        "meetings/$meeting/read-marker",
                        "PUT",
                        JSONObject().put("read_through_sequence", sequence),
                    )
                }
                fixture.waitText("Прочитали 2")
                compose.onNodeWithText("Прочитали 2").performScrollTo()
                val populatedBefore = row.fetchSemanticsNode().boundsInWindow.top
                NativeTalkBack.use(fixture, activity) { automation ->
                    NativeTalkBack.await {
                        automation.rootInActiveWindow?.let(NativeTalkBack::walk).orEmpty()
                            .any { it.text?.toString() == "Прочитали 2" }
                    }
                    val receipt = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                        .first { it.text?.toString() == "Прочитали 2" }
                    assertTrue(
                        receipt.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS),
                    )
                    NativeTalkBack.await {
                        automation.rootInActiveWindow?.findFocus(
                            AccessibilityNodeInfo.FOCUS_ACCESSIBILITY,
                        )?.let { label(it).contains("Прочитали 2") } == true
                    }
                    var opener = receipt.parent
                    while (opener != null && !opener.isClickable) opener = opener.parent
                    assertTrue(
                        checkNotNull(opener).performAction(AccessibilityNodeInfo.ACTION_CLICK),
                    )
                    compose.mainClock.advanceTimeBy(400)
                    NativeTalkBack.await {
                        compose.mainClock.advanceTimeBy(50)
                        val nodes = automation.rootInActiveWindow?.let(
                            NativeTalkBack::walk,
                        ).orEmpty()
                        nodes.any { it.text?.toString() == "Лена" } &&
                            nodes.any { it.text?.toString() == "Миша" }
                    }
                    val nodes = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                    assertTrue(nodes.none { label(it).contains("sasha@example.com") })
                    val person = nodes.first { it.text?.toString() == "Миша" }
                    assertTrue(
                        person.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS),
                    )
                    NativeTalkBack.capture(automation, "readers-large-talkback-two")
                    val dismiss = nodes.first { node ->
                        node.actionList.any { it.id == AccessibilityNodeInfo.ACTION_DISMISS }
                    }
                    assertTrue(dismiss.performAction(AccessibilityNodeInfo.ACTION_DISMISS))
                    compose.mainClock.advanceTimeBy(500)
                    NativeTalkBack.await {
                        compose.mainClock.advanceTimeBy(50)
                        automation.rootInActiveWindow?.findFocus(
                            AccessibilityNodeInfo.FOCUS_ACCESSIBILITY,
                        )?.let { focused ->
                            label(focused).contains(text) ||
                                label(focused).contains("Прочитали 2") ||
                                (
                                    focused.isClickable &&
                                        NativeTalkBack.walk(focused).any {
                                            label(it).contains(text)
                                        }
                                    )
                        } == true
                    }
                    NativeTalkBack.capture(automation, "readers-talkback-returned")
                }
                fixture.waitAbsent("chat-readers")
                assertTrue(
                    abs(row.fetchSemanticsNode().boundsInWindow.top - populatedBefore) <=
                        2 * compose.density.density,
                )
            }
        } finally {
            QaResponseGate.unavailableGetPath = null
            if (scale == "null") {
                fixture.shell("settings delete system font_scale")
            } else {
                require(scale.toFloatOrNull() != null)
                fixture.shell("settings put system font_scale $scale")
            }
        }
    }

    private fun label(node: AccessibilityNodeInfo): String =
        listOfNotNull(node.text, node.contentDescription).joinToString(" ")
}

package dev.groupplanning.android

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.lifecycle.Lifecycle
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.util.UUID
import kotlin.math.abs
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ChatReadLiveUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun secondUserReceiptsSdkIdleLifecycleImeBackAndRevoke() {
        val api = ChatReadLiveApi(fixture.context)
        val title = "Чтение Android " + UUID.randomUUID().toString().take(8)
        val created = api.request(
            "design",
            "meetings",
            "POST",
            JSONObject()
                .put("title", title).put("starts_on", "2026-11-10").put("timezone", "UTC"),
        )
        val id = created.getJSONObject("meeting").getString("id")
        val invitation = created.getString("invitation_url").substringAfter("/i/")
        api.request(
            "invite-rsvp",
            "invitations/$invitation/rsvp",
            "PUT",
            JSONObject()
                .put("answer", "going").put("expected_revision", "0"),
        )
        val base = "meetings/$id"
        api.request("invite-rsvp", "$base/sync")
        api.request("design", "$base/sync")
        repeat(12) { api.message("design", id, "Входящее сообщение ${it + 1}") }
        val own = api.message("invite-rsvp", id, "Моё сообщение для проверки прочтения")
        val ownSequence = own.getString("sequence")
        val ownId = own.getString("id")
        val output = File(
            checkNotNull(
                InstrumentationRegistry.getArguments()
                    .getString("additionalTestOutputDir"),
            ),
        ).apply { mkdirs() }
        QaChatProbe.reset()
        try {
            fixture.launch("invite-rsvp").use { activity ->
                fixture.waitTag("meetings-list")
                compose.onNodeWithTag(
                    "meetings-list",
                ).performScrollToNode(hasTestTag("meeting-$id"))
                compose.onNodeWithTag("meeting-$id").performClick()
                fixture.waitTag("message-composer")
                compose.waitUntil(15_000) { QaChatProbe.signals.contains("meeting:Subscribed") }
                fixture.waitTag("chat-unread-divider")
                compose.waitUntil(15_000) {
                    api.request("invite-rsvp", "$base/sync").getString("my_read_state") != "0"
                }
                fixture.screenshot("read-first-unread")
                compose.onNodeWithTag("feed-end").performClick()
                fixture.waitText("Моё сообщение для проверки прочтения")
                val row = compose.onNodeWithTag("feed-entry-$ownSequence")
                val top = row.fetchSemanticsNode().boundsInRoot.top
                row.performTouchInput { longClick() }
                fixture.waitTag("chat-read-context")
                fixture.screenshot("read-context-zero")
                compose.onNodeWithTag("chat-read-context").performClick()
                fixture.waitText("Пока никто не прочитал")
                fixture.screenshot("read-empty")
                fixture.device.pressBack()
                fixture.waitAbsent("chat-readers")
                assertTrue(
                    abs(row.fetchSemanticsNode().boundsInRoot.top - top) <=
                        2 * compose.density.density,
                )
                api.request(
                    "design",
                    "$base/read-marker",
                    "PUT",
                    JSONObject()
                        .put("read_through_sequence", ownSequence),
                )
                fixture.waitText("Прочитали 1")
                compose.onNodeWithText("Прочитали 1").performClick()
                val ownerName = api.request(
                    "design",
                    "me",
                ).getJSONObject("user").getString("display_name")
                fixture.waitText(ownerName)
                fixture.screenshot("read-people")
                compose.onNodeWithTag("close-action-sheet").performClick()
                fixture.waitAbsent("chat-readers")
                val closedBefore = QaChatProbe.signals.count { it == "meeting:closed" }
                QaChatProbe.interruptMeeting()
                compose.waitUntil(5_000) {
                    QaChatProbe.signals.count { it == "meeting:closed" } > closedBefore
                }
                api.message("design", id, "Сообщение во время разрыва")
                fixture.waitText("Сообщение во время разрыва")
                assertTrue(QaChatProbe.signals.count { it == "meeting:Subscribed" } >= 2)
                assertTrue(QaChatProbe.requests.any { it.endsWith("/sync (cursor present)") })
                compose.onNodeWithTag(
                    "message-composer",
                ).performClick().performTextInput("Черновик 🧭")
                fixture.device.pressBack()
                compose.onNodeWithTag("message-composer").assertTextContains("Черновик 🧭")
                compose.onNodeWithTag("emoji-open").performClick()
                fixture.waitTag("emoji-dock")
                fixture.device.pressBack()
                fixture.waitAbsent("emoji-dock")
                compose.onNodeWithTag("message-composer").assertTextContains("Черновик 🧭")
                // Flush viewport dwell work, then wait for its read-marker/WS catch-up.
                // Virtual Compose time is not an HTTP idle observation window.
                compose.mainClock.advanceTimeBy(6_000)
                compose.waitForIdle()
                compose.waitUntil(10_000) {
                    val last = QaChatProbe.events.lastOrNull()?.substringBefore(' ')?.toLongOrNull()
                    last != null && android.os.SystemClock.elapsedRealtime() - last >= 2_500
                }
                QaChatProbe.mark("IDLE START")
                val idle = QaChatProbe.requests.size
                Thread.sleep(12_000)
                QaChatProbe.mark("IDLE END")
                assertEquals(
                    "Healthy SDK must not poll HTTP at idle",
                    idle,
                    QaChatProbe.requests.size,
                )
                activity.moveToState(Lifecycle.State.CREATED)
                compose.waitUntil(5_000) { QaChatProbe.signals.lastOrNull() == "meeting:closed" }
                // A previously qualified, throttled departure PUT may finish.
                Thread.sleep(1_100)
                val background = QaChatProbe.requests.size
                val incoming = api.message("design", id, "Сообщение после возврата")
                Thread.sleep(1_200)
                assertEquals(
                    "Background must own no HTTP work",
                    background,
                    QaChatProbe.requests.size,
                )
                activity.moveToState(Lifecycle.State.RESUMED)
                fixture.waitText("Сообщение после возврата")
                compose.onNodeWithTag("message-composer").assertTextContains("Черновик 🧭")
                compose.waitUntil(15_000) {
                    api.request("invite-rsvp", "$base/sync").getString("my_read_state") ==
                        incoming.getString("sequence")
                }
                val detail = api.request("invite-rsvp", base)
                api.request(
                    "invite-rsvp",
                    "$base/rsvp",
                    "PUT",
                    JSONObject()
                        .put(
                            "answer",
                            "not_going",
                        ).put("expected_revision", detail.getString("my_rsvp_revision")),
                )
                fixture.waitAbsent("message-composer")
                assertTrue(QaChatProbe.signals.contains("meeting:AccessRevoked"))
                fixture.screenshot("read-revoked")
            }
        } finally {
            File(output, "read-runtime.json").writeText(
                JSONObject()
                    .put("meeting_id", id).put("own_entry_id", ownId)
                    .put("sdk", "CentrifugeJava 0.8.0")
                    .put("signals", JSONArray(QaChatProbe.signals.toList()))
                    .put("events", JSONArray(QaChatProbe.events.toList()))
                    .put("requests", JSONArray(QaChatProbe.requests.toList())).toString(2),
            )
        }
    }
}

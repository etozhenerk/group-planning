package dev.groupplanning.android

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipe
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.util.UUID
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class AvatarAcknowledgementUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val meeting = "deb00000-0000-4000-8000-000000000002"

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun httpAndLostReplyKeepPhoto() {
        requireFixture("http")
        verify("http", "before", true)
        verify("http-lost", "drop", true)
    }

    @Test fun realtimeAndLostReplyKeepPhoto() {
        requireFixture("realtime")
        verify("realtime", "after", true)
        verify("realtime-lost", "drop", true)
    }

    @Test fun profileWithoutPhotoKeepsInitial() {
        requireFixture("fallback")
        verify("fallback", "after", false)
    }

    private fun requireFixture(mode: String) {
        val config =
            JSONObject(File(fixture.context.noBackupFilesDir, "ui-fixture.json").readText())
        assertEquals(mode, config.getString("avatarCheck"))
    }

    private fun verify(name: String, mode: String, photo: Boolean) {
        QaChatProbe.reset()
        fixture.launch("design").use {
            compose.onNodeWithTag("meetings-list").assertExists()
            compose.onNodeWithTag("meeting-$meeting").performClick()
            fixture.waitTag("message-composer")
            if (mode == "after" || name == "realtime-lost") {
                compose.waitUntil(15_000) {
                    QaChatProbe.signals.any { it.startsWith("meeting:Subscribed") }
                }
            }
            val hintCount = QaChatProbe.signals.count { it == "meeting:Changed" }
            val text = "Аватар $name ${UUID.randomUUID().toString().take(6)}"
            val evidence = AvatarFrameCapture()
            QaAvatarAckGate.hold(mode)
            try {
                compose.onNodeWithTag("message-composer").performTextReplacement(text)
                fixture.device.pressBack()
                compose.onNodeWithTag("message-send").performClick()
                fixture.waitTag("message-pending")
                compose.waitUntil(15_000) { QaAvatarAckGate.entered }
                compose.waitUntil(15_000) { evidence.capture("$name-ready", avatar(text), photo) }
                fixture.screenshot("avatar-$name-before")
                QaAvatarAckGate.allowCommit()
                var accepted = false
                for (index in 0 until 100) {
                    assertTrue(evidence.capture("$name-$index", avatar(text), photo))
                    accepted = rowTag(text).startsWith("feed-entry-")
                    if (accepted && index >= 12) break
                    Thread.sleep(30)
                }
                assertTrue("The real server entry must replace the pending state", accepted)
                if (mode == "after") {
                    assertTrue(QaAvatarAckGate.replyHeld)
                    assertTrue(QaChatProbe.signals.count { it == "meeting:Changed" } > hintCount)
                }
                QaAvatarAckGate.release()
                for (index in 0 until 8) {
                    assertTrue(evidence.capture("$name-tail-$index", avatar(text), photo))
                    Thread.sleep(30)
                }
                val api = ChatReadLiveApi(fixture.context)
                val page = api.request("design", "meetings/$meeting/feed")
                val entries = page.getJSONArray("entries")
                assertEquals(
                    1,
                    (0 until entries.length()).count { index ->
                        entries.getJSONObject(index).getJSONObject("payload").optString("text") ==
                            text
                    },
                )
                fixture.screenshot("avatar-$name-accepted")
                if (!photo || name == "realtime") {
                    val oldY = avatar(text).fetchSemanticsNode().boundsInWindow.top
                    compose.onNodeWithTag("feed-timeline").performTouchInput {
                        swipe(
                            Offset(width * .45f, height * .5f),
                            Offset(width * .45f, height * .55f),
                            400,
                        )
                    }
                    assertTrue(avatar(text).fetchSemanticsNode().boundsInWindow.top > oldY + 20)
                    repeat(5) { index ->
                        assertTrue(
                            evidence.capture("$name-scroll-$index", avatar(text), photo, false),
                        )
                    }
                    fixture.screenshot("avatar-$name-scrolled")
                }
            } finally {
                evidence.finish(name)
                QaAvatarAckGate.release()
            }
        }
    }

    private fun rowTag(text: String): String {
        var node = compose.onNodeWithText(text).fetchSemanticsNode()
        while (true) {
            val tag = node.config.getOrElse(SemanticsProperties.TestTag) { "" }
            if (tag == "message-pending" || tag.startsWith("feed-entry-")) return tag
            node = checkNotNull(node.parent) { "Message row is missing" }
        }
    }

    private fun avatar(text: String) = compose.onAllNodes(
        hasContentDescription("Саша") and hasAnyAncestor(
            SemanticsMatcher("Message row") {
                val tag = it.config.getOrElse(SemanticsProperties.TestTag) { "" }
                tag == "message-pending" || tag.startsWith("feed-entry-")
            } and hasAnyDescendant(hasText(text)),
        ),
        useUnmergedTree = true,
    ).onFirst()
}

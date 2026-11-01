package dev.groupplanning.android

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

// The shell runner force-stops the application between these two instrumentation runs.
class FeedPersistenceUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule =
        QaAppLocaleRule(persistentNamespace = "process-death")

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun prepareProcessDeath() {
        // Let the fixture reject the first POST; keep SDK resume from confirming a retry.
        QaResponseGate.allowOnePersistenceMessageAttempt()
        fixture.launch("feed-persistence", "RUVFRUVFRUVFRUVFRUVFRQ").use {
            fixture.waitTag("message-composer")
            fixture.waitText("Возьмите настолки, пиццу закажу я.")
            compose.onNodeWithTag(
                "message-composer",
            ).performTextInput("Сообщение переживёт перезапуск")
            compose.onNodeWithTag("message-send").performClick()
            fixture.waitTag("message-retry")
            QaResponseGate.rejectMessage = true
            compose.onNodeWithTag("message-composer").performTextInput("И черновик тоже")
            compose.waitForIdle()
            fixture.screenshot("feed-before-process-death")
        }
    }

    @Test fun restoreAfterProcessDeath() {
        QaResponseGate.rejectMessage = true
        try {
            fixture.launch("feed-persistence").use {
                fixture.waitTag("message-retry")
                compose.onNodeWithTag("message-composer").assertTextContains("И черновик тоже")
                fixture.screenshot("feed-restored-after-process-death")
                QaResponseGate.releasePersistenceMessageAttempts()
                QaResponseGate.rejectMessage = false
                compose.onNodeWithTag("message-retry").performClick()
                compose.waitUntil(10_000) {
                    compose.onAllNodes(
                        hasTestTag("message-pending"),
                    ).fetchSemanticsNodes().isEmpty()
                }
                compose.onNodeWithTag("message-composer").assertTextContains("И черновик тоже")
                fixture.screenshot("feed-restored-confirmed")
            }
        } finally {
            QaResponseGate.releasePersistenceMessageAttempts()
            QaResponseGate.rejectMessage = false
        }
    }
}

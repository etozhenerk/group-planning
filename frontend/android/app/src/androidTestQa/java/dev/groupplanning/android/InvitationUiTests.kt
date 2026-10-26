package dev.groupplanning.android

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class InvitationUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun publicInvitationPersistsWithoutLoginOrAutomaticResponse() {
        fixture.launch("invite-anonymous", fixture.token).use { activity ->
            fixture.waitText("Ответьте на приглашение")
            compose.onAllNodes(hasTestTag("invitation-conversation")).assertCountEquals(0)
            compose.onAllNodesWithText("Лена").assertCountEquals(0)
            fixture.screenshot("invitation-anonymous")
            compose.onNodeWithText("Войти и ответить").performScrollTo().performClick()
            fixture.waitText("Не удалось войти")
            compose.onNodeWithText("Понятно").performClick()
            activity.recreate()
            fixture.waitText("Настолки у Саши")
        }
        fixture.launch("invite-anonymous").use {
            fixture.waitText("Настолки у Саши")
            fixture.device.pressBack()
            fixture.waitTag("onboarding")
        }
        fixture.launch("invite-anonymous").use { fixture.waitTag("onboarding") }
    }

    @Test fun allResponsesControlPeopleAndChatAcrossReentry() {
        fixture.launch("invite-rsvp", fixture.token).use {
            fixture.waitText("Сможете прийти?")
            respond("Возможно")
            fixture.waitText("Вы пока не уверены")
            assertClosed()
            fixture.screenshot("invitation-maybe")
            respond("Приду")
            fixture.waitTag("invitation-conversation")
            fixture.waitText("Возьмите настолки, пиццу закажу я.")
            fixture.screenshot("invitation-accepted")
            openInformation()
            compose.onNodeWithTag("invitation-people").performScrollTo()
            compose.onNodeWithText("Участники · 2").assertIsDisplayed()
            compose.onNodeWithText("Лена").assertIsDisplayed()
            fixture.screenshot("invitation-people")
            respond("Не смогу")
            fixture.waitText("Вы не сможете прийти")
            assertClosed()
            fixture.screenshot("invitation-declined")
            fixture.device.pressBack()
            fixture.waitText("С чего начнём?")
        }
        fixture.launch("invite-rsvp-reentry", fixture.token).use {
            fixture.waitText("Вы не сможете прийти")
            respond("Приду")
            fixture.waitTag("invitation-conversation")
            openInformation()
            respond("Возможно")
            fixture.waitText("Вы пока не уверены")
            assertClosed()
        }
    }

    @Test fun lostResponseRetriesOriginalRequestAfterRecreation() {
        fixture.launch("invite-error", "QkJCQkJCQkJCQkJCQkJCQg").use { activity ->
            fixture.waitText("Сможете прийти?")
            respond("Возможно")
            fixture.waitText("Повторить сохранение")
            assertClosed()
            fixture.screenshot("invitation-retry")
            activity.recreate()
            fixture.waitText("Повторить сохранение")
            compose.onNodeWithTag("rsvp-save").performScrollTo().performClick()
            fixture.waitText("Вы пока не уверены")
            assertClosed()
        }
    }

    @Test fun organizerSharesServerLinkAndWarmLinkReplacesCurrentInvitation() {
        fixture.launch("invite-owner").use { activity ->
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performClick()
            fixture.waitTag("invitation-conversation")
            compose.waitUntil(10_000) {
                compose.onAllNodesWithContentDescription(
                    "Пригласить друзей",
                ).fetchSemanticsNodes().isNotEmpty()
            }
            compose.onNodeWithContentDescription("Пригласить друзей").performClick()
            assertTrue(
                fixture.device.wait(Until.hasObject(By.pkg("com.android.intentresolver")), 10_000),
            )
            fixture.screenshot("invitation-system-share")
            fixture.device.pressBack()
            compose.waitUntil(10_000) { activity.state == Lifecycle.State.RESUMED }
            lateinit var original: Intent
            lateinit var launched: MainActivity
            activity.onActivity {
                launched = it
                original = Intent(it.intent)
                it.startActivity(
                    Intent(it, MainActivity::class.java).apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("group-planning-android-qa://i/QkJCQkJCQkJCQkJCQkJCQg")
                        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    },
                )
            }
            try {
                fixture.waitText("Проверка повтора")
                fixture.waitTag("invitation-conversation")
                fixture.screenshot("invitation-warm-link")
            } finally {
                // ActivityScenario identifies its Activity by the original Intent.
                // Restore only the test harness identity after exercising onNewIntent.
                InstrumentationRegistry.getInstrumentation().runOnMainSync {
                    launched.intent = original
                }
            }
        }
    }

    @Test fun largeTextKeepsPublicInvitationActionReachable() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("invite-anonymous", fixture.token).use {
                fixture.waitText("Ответьте на приглашение")
                compose.onNodeWithText("Войти и ответить").performScrollTo().assertIsDisplayed()
                fixture.screenshot("invitation-large-text")
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

    private fun respond(answer: String) {
        compose.onNode(hasText(answer) and hasClickAction()).performScrollTo().performClick()
        compose.onNodeWithTag("rsvp-save").performScrollTo().performClick()
    }

    private fun openInformation() {
        compose.onNodeWithContentDescription("Информация о встрече").performClick()
        fixture.waitTag("invitation-people")
    }

    private fun assertClosed() {
        compose.onAllNodes(hasTestTag("invitation-conversation")).assertCountEquals(0)
        compose.onAllNodes(hasTestTag("invitation-people")).assertCountEquals(0)
        compose.onAllNodesWithText("Возьмите настолки, пиццу закажу я.").assertCountEquals(0)
    }
}

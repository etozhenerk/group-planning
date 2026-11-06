package dev.groupplanning.android

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.time.Instant
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class InvitationUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun cutoffForegroundDateOnlyReturnAndStaleSubmission() {
        val api = ChatReadLiveApi(fixture.context)
        val id = "22222222-2222-4222-8222-222222222222"
        fun reschedule(seconds: Long?) {
            val details = api.request("invite-owner", "meetings/$id")
            val start = seconds?.let { Instant.now().plusSeconds(it) }
            api.request(
                "invite-owner",
                "meetings/$id",
                "PATCH",
                JSONObject().put("expected_revision", details.getString("revision"))
                    .put("starts_at", start?.toString() ?: JSONObject.NULL)
                    .put(
                        "starts_on",
                        (start ?: Instant.now().plusSeconds(86400)).toString().take(10),
                    )
                    .put("timezone", "UTC"),
            )
        }
        fun waitGoing(enabled: Boolean, timeout: Long = 15000) {
            compose.waitUntil(timeout) {
                val nodes = compose.onAllNodes(hasTestTag("rsvp-Going")).fetchSemanticsNodes()
                if (enabled) {
                    nodes.singleOrNull()?.config?.contains(SemanticsProperties.Disabled) == false
                } else {
                    nodes.isEmpty()
                }
            }
        }
        reschedule(null)
        SecondDeviceRsvp(fixture, "invite-rsvp").respond(fixture.token, RsvpAnswer.NotGoing)
        fixture.launch("invite-rsvp", fixture.token).use { activity ->
            fixture.waitTag("rsvp-Going")
            waitGoing(true)
            respond("Приду")
            fixture.waitTag("invitation-conversation")
            activity.moveToState(Lifecycle.State.CREATED)
            reschedule(1800)
            activity.moveToState(Lifecycle.State.RESUMED)
            fixture.waitTag("invitation-conversation")
            openInformation()
            respond("Не смогу")
            fixture.waitTag("rsvp-declined")
            reopen(activity)
            waitGoing(false)
            assertClosed()
            fixture.screenshot("cutoff-returning-closed")

            activity.moveToState(Lifecycle.State.CREATED)
            reschedule(3615)
            activity.moveToState(Lifecycle.State.RESUMED)
            waitGoing(true)
            waitGoing(false, 22000)
            fixture.screenshot("cutoff-timer-closed")

            activity.moveToState(Lifecycle.State.CREATED)
            reschedule(86400)
            activity.moveToState(Lifecycle.State.RESUMED)
            waitGoing(true)
            reschedule(1800)
            compose.onNodeWithTag("rsvp-Going").performClick()
            waitGoing(false)
            assertClosed()
            fixture.screenshot("cutoff-stale-server-closed")
        }
        reschedule(86400)
    }

    @Test fun publicInvitationPersistsWithoutLoginOrAutomaticResponse() {
        fixture.launch("invite-anonymous", fixture.token).use { activity ->
            fixture.waitText("Войти через Яндекс ID")
            compose.onAllNodes(hasTestTag("invitation-conversation")).assertCountEquals(0)
            compose.onAllNodesWithText("Лена").assertCountEquals(0)
            fixture.screenshot("invitation-anonymous")
            compose.onNodeWithText("Войти через Яндекс ID").performClick()
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
        SecondDeviceRsvp(fixture, "invite-rsvp").respond(fixture.token, RsvpAnswer.NotGoing)
        fixture.launch("invite-rsvp", fixture.token).use { activity ->
            fixture.waitTag("rsvp-Going")
            respond("Возможно")
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            fixture.waitTag("saved-invitation-22222222-2222-4222-8222-222222222222")
            assertClosed()
            fixture.screenshot("invitation-maybe")
            reopen(activity)
            fixture.waitTag("rsvp-Maybe")
            compose.onNodeWithTag("rsvp-Maybe").assertIsSelected()
            respond("Приду")
            fixture.waitTag("invitation-conversation")
            fixture.waitText("Возьмите настолки, пиццу закажу я.")
            fixture.screenshot("invitation-accepted")
            openInformation()
            compose.onNodeWithTag("invitation-people").performScrollTo()
            compose.onNodeWithContentDescription("Все участники встречи: 2")
                .assertIsDisplayed().performClick()
            compose.onNodeWithText(fixture.context.getString(R.string.participants_heading))
                .performScrollTo().assertIsDisplayed()
            compose.onNode(
                hasText("Лена") and hasAnyAncestor(hasTestTag("participant-roster-row")),
                useUnmergedTree = true,
            ).performScrollTo().assertIsDisplayed()
            fixture.screenshot("invitation-people")
            respond("Не смогу")
            fixture.waitTag("rsvp-declined")
            fixture.waitText("Вы ответили «Не смогу»")
            compose.onNodeWithText("Организатор увидит ваш ответ.").assertIsDisplayed()
            assertClosed()
            fixture.screenshot("invitation-declined")
            compose.onNodeWithText("К моим встречам").performScrollTo().performClick()
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("meeting-22222222-2222-4222-8222-222222222222")
                .assertDoesNotExist()
            val api = ChatReadLiveApi(fixture.context)
            val meetings = api.request("invite-rsvp", "meetings?period=upcoming")
                .getJSONArray("meetings")
            assertTrue(
                (0 until meetings.length()).none {
                    meetings.getJSONObject(it).getString("id") ==
                        "22222222-2222-4222-8222-222222222222"
                },
            )
            assertTrue(
                api.request("invite-rsvp", "invitations/${fixture.token}")
                    .getString("my_rsvp") == "not_going",
            )
        }
        fixture.launch("invite-rsvp-reentry", fixture.token).use {
            fixture.waitTag("rsvp-NotGoing")
            compose.onNodeWithTag("rsvp-NotGoing").assertIsSelected()
            respond("Приду")
            fixture.waitTag("invitation-conversation")
            openInformation()
            respond("Возможно")
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            fixture.waitTag("saved-invitation-22222222-2222-4222-8222-222222222222")
            assertClosed()
        }
    }

    @Test fun lostResponseRetriesOriginalRequestAfterRecreation() {
        fixture.launch("invite-error", "QkJCQkJCQkJCQkJCQkJCQg").use { activity ->
            fixture.waitTag("rsvp-Going")
            respond("Возможно")
            fixture.waitText(
                "Сохранение не подтверждено. Повторите запрос.",
            )
            assertClosed()
            fixture.screenshot("invitation-retry")
            activity.recreate()
            fixture.waitText(
                "Сохранение не подтверждено. Повторите запрос.",
            )
            compose.onNodeWithTag("rsvp-Maybe").assertIsEnabled()
            compose.onNodeWithTag("rsvp-Going").assertIsNotEnabled()
            compose.onNodeWithTag("rsvp-NotGoing").assertIsNotEnabled()
            compose.onNodeWithTag("rsvp-Maybe").performClick()
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            fixture.waitTag("saved-invitation-55555555-5555-4555-8555-555555555555")
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
                fixture.waitText("Войти через Яндекс ID")
                compose.onNodeWithText("Войти через Яндекс ID").assertIsDisplayed()
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
        val name = when (answer) {
            "Приду" -> "Going"
            "Возможно" -> "Maybe"
            else -> "NotGoing"
        }
        val public = compose.onAllNodes(hasTestTag("rsvp-$name")).fetchSemanticsNodes().isNotEmpty()
        val action = compose.onNodeWithTag(if (public) "rsvp-$name" else "information-rsvp-$name")
        if (!public) {
            if (compose.onAllNodes(hasTestTag("information-rsvp-$name"))
                    .fetchSemanticsNodes().isEmpty()
            ) {
                compose.onNodeWithTag("information-change-answer").performClick()
            }
            fixture.waitTag("meeting-information-rsvp")
            action.performScrollTo()
        }
        action.performClick()
    }

    private fun reopen(activity: ActivityScenario<MainActivity>) {
        lateinit var original: Intent
        lateinit var launched: MainActivity
        activity.onActivity {
            launched = it
            original = Intent(it.intent)
            it.startActivity(
                Intent(it, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    data = Uri.parse("group-planning-android-qa://i/${fixture.token}")
                    addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                },
            )
        }
        fixture.waitText("Настолки у Саши")
        InstrumentationRegistry.getInstrumentation().runOnMainSync { launched.intent = original }
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

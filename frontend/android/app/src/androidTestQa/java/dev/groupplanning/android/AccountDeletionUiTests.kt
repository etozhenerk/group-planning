package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/** Account deletion remains covered below UI; its entry is intentionally hidden for this release. */
class AccountDeletionUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun survivorKeepsMeetingAndAnonymizedHistoryAfterOwnerDeletion() {
        val api = ChatReadLiveApi(fixture.context)
        val owner = "account-removal-owner"
        val survivor = "account-removal-survivor"
        val created = api.request(
            owner,
            "meetings",
            "POST",
            JSONObject().put("title", "Сохранённая общая встреча")
                .put("starts_on", "2099-11-10").put("timezone", "UTC"),
        )
        val id = created.getJSONObject("meeting").getString("id")
        val token = created.getString("invitation_url").substringAfterLast('/')
        api.request(
            survivor,
            "invitations/$token/rsvp",
            "PUT",
            JSONObject().put("answer", "going").put("expected_revision", "0"),
        )
        api.message(owner, id, "История остаётся участникам")
        fixture.launch(survivor).use {
            fixture.waitText("Сохранённая общая встреча")
            compose.onNodeWithText("Сохранённая общая встреча").performClick()
            fixture.waitTag("message-composer")
            fixture.waitText("История остаётся участникам")
            api.request(owner, "me", "DELETE")
            fixture.waitText("Удалённый аккаунт")
            val me = api.request(survivor, "me").getJSONObject("user").getString("id")
            val details = api.request(survivor, "meetings/$id")
            check(details.getString("organizer_id") == me)
            check(details.getInt("participant_count") == 1)
            compose.onNodeWithTag("message-composer").performTextInput("После передачи организации")
            compose.onNodeWithTag("message-send").performClick()
            fixture.waitText("После передачи организации")
            fixture.screenshot("account-survivor-history")
            it.recreate()
            fixture.waitText("История остаётся участникам")
            fixture.waitText("Удалённый аккаунт")
        }
    }

    @Test fun profileKeepsLogoutAndHidesDeletionEntry() {
        fixture.launch("account").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Вход через Яндекс ID")
            compose.onNodeWithText("Удалить аккаунт").assertDoesNotExist()
            compose.onNodeWithText("Выйти из аккаунта").performScrollTo().assertIsDisplayed()
            fixture.screenshot("profile-logout-without-delete")
        }
    }

    @Test fun serviceBackReturnsToProfile() {
        fixture.launch("account-large").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Вход через Яндекс ID")
            val cookies = compose.onNodeWithText(fixture.context.getString(R.string.cookies_title))
            cookies.performScrollTo()
            check(
                cookies.fetchSemanticsNode().boundsInRoot.bottom <=
                    compose.onNodeWithTag("home-navigation").fetchSemanticsNode().boundsInRoot.top,
            )
            fixture.screenshot("profile-cookies-above-navigation")
            cookies.performClick()
            fixture.waitTag("service-page")
            compose.onNodeWithContentDescription("Назад").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
            compose.onNodeWithText("Удалить аккаунт").assertDoesNotExist()
        }
    }

    @Test fun helpDisclosureKeepsStateAndBackReturnsToProfile() {
        fixture.launch("calendar").use { activity ->
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Вход через Яндекс ID")
            compose.onNodeWithText(fixture.context.getString(R.string.help_title))
                .performScrollTo().performClick()
            fixture.waitTag("service-page")
            val question = fixture.context.getString(R.string.help_invitation_question)
            val answer = fixture.context.getString(R.string.help_invitation_answer)
            compose.onNodeWithText(question).assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Ответ раскрыт",
                ),
            )
            compose.onNodeWithText(question).performClick()
            compose.onNodeWithText(answer).assertDoesNotExist()
            activity.recreate()
            fixture.waitTag("service-page")
            compose.onNodeWithText(question).assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.StateDescription,
                    "Ответ скрыт",
                ),
            )
            compose.onNodeWithText(question).performClick()
            compose.onNodeWithText(answer).assertIsDisplayed()
            fixture.screenshot("profile-help-disclosure-open")
            compose.onNodeWithContentDescription("Назад").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
        }
    }
}

package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/** Account deletion remains covered below UI; its entry is intentionally hidden for this release. */
class AccountDeletionUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun profileKeepsLogoutAndHidesDeletionEntry() {
        fixture.launch("account").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
            compose.onNodeWithText("Удалить аккаунт").assertDoesNotExist()
            compose.onNodeWithText("Выйти").performScrollTo().assertIsDisplayed()
            fixture.screenshot("profile-logout-without-delete")
        }
    }

    @Test fun serviceBackReturnsToProfile() {
        fixture.launch("account-large").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
            val cookies = compose.onNodeWithText(fixture.context.getString(R.string.cookies_title))
            cookies.performScrollTo()
            check(
                cookies.fetchSemanticsNode().boundsInRoot.bottom <=
                    compose.onNodeWithTag("home-navigation").fetchSemanticsNode().boundsInRoot.top,
            )
            fixture.screenshot("profile-cookies-above-navigation")
            cookies.performClick()
            fixture.waitTag("service-page")
            compose.onNodeWithText("Назад").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
            compose.onNodeWithText("Удалить аккаунт").assertDoesNotExist()
        }
    }

    @Test fun helpDisclosureKeepsStateAndBackReturnsToProfile() {
        fixture.launch("calendar").use { activity ->
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
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
            compose.onNodeWithText("Назад").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
        }
    }
}

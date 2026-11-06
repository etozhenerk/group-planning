package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

// Covers UI-triggered login and field synchronization, not real Yandex OAuth or avatar bytes.
class ProfileFieldsUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun profileFieldsAcrossThreeUiLogins() {
        fixture.launch("profile-fields").use {
            for (stage in listOf("full", "partial", "clear")) {
                fixture.waitTag("onboarding")
                if (compose.onAllNodesWithText("Пропустить").fetchSemanticsNodes().isNotEmpty()) {
                    compose.onNodeWithText("Пропустить").performClick()
                }
                ProfileFieldsLoginSupport(stage).use {
                    compose.onNodeWithContentDescription("Войти через Яндекс ID").performClick()
                    fixture.waitTag("home-profile")
                }
                compose.onNodeWithTag("home-profile").performClick()
                fixture.waitTag("profile-account-data")
                compose.onNodeWithTag("profile-account-data").performScrollTo().performClick()
                fixture.waitTag("profile-account-sheet")
                fixture.waitText("profile_fixture")
                compose.onNodeWithText("Александр").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText("Тестов").performScrollTo().assertIsDisplayed()
                when (stage) {
                    "full" -> {
                        compose.onNodeWithText("23 декабря 1990")
                            .performScrollTo().assertIsDisplayed()
                        fixture.screenshot("profile-full-before-gender-scroll")
                        compose.onNodeWithText("Мужской").performScrollTo().assertIsDisplayed()
                    }
                    "partial" -> {
                        compose.onNodeWithText("23 декабря").performScrollTo().assertIsDisplayed()
                        compose.onNodeWithText("23 декабря 1990").assertDoesNotExist()
                        compose.onNode(
                            hasText("Не указано") and
                                hasTestTag("profile-field-profile_sex"),
                        ).performScrollTo().assertIsDisplayed()
                    }
                    else -> {
                        compose.onNode(
                            hasText("Не указано") and
                                hasTestTag("profile-field-profile_birthday"),
                        ).performScrollTo().assertIsDisplayed()
                        compose.onNodeWithText("23 декабря").assertDoesNotExist()
                    }
                }
                fixture.screenshot("profile-fields-$stage-personal")
                compose.onNodeWithText("profile@example.test").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText(if (stage == "clear") "Не указан" else "+79990000000")
                    .performScrollTo().assertIsDisplayed()
                fixture.screenshot("profile-fields-$stage-contacts")
                assertTrue(QaChatProbe.requests.any { it == "GET /api/v1/me/profile" })
                assertTrue(QaChatProbe.requests.none { it == "DELETE /api/v1/me" })
                if (stage != "clear") {
                    fixture.device.pressBack()
                    fixture.waitAbsent("profile-account-sheet")
                    compose.onNodeWithText("Выйти из аккаунта").performScrollTo().performClick()
                }
            }
        }
    }
}

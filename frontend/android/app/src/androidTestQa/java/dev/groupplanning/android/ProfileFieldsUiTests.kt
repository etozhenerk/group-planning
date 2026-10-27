package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnySibling
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

// Covers UI-triggered login and field synchronization, not real Yandex OAuth or avatar bytes.
class ProfileFieldsUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
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
                    compose.onNodeWithContentDescription("Попробовать").performClick()
                    fixture.waitTag("home-profile")
                }
                compose.onNodeWithTag("home-profile").performClick()
                fixture.waitText("profile_fixture")
                compose.onNodeWithText("Александр").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText("Тестов").performScrollTo().assertIsDisplayed()
                when (stage) {
                    "full" -> {
                        compose.onNodeWithText("23 декабря 1990")
                            .performScrollTo().assertIsDisplayed()
                        compose.onNodeWithText("Мужской").assertIsDisplayed()
                    }
                    "partial" -> {
                        compose.onNodeWithText("23 декабря").performScrollTo().assertIsDisplayed()
                        compose.onNodeWithText("23 декабря 1990").assertDoesNotExist()
                        compose.onNode(
                            hasText("Не указано") and hasAnySibling(hasText("Пол")),
                        ).performScrollTo().assertIsDisplayed()
                    }
                    else -> {
                        compose.onNode(
                            hasText("Не указано") and hasAnySibling(hasText("Дата рождения")),
                        ).performScrollTo().assertIsDisplayed()
                        compose.onNodeWithText("23 декабря").assertDoesNotExist()
                    }
                }
                fixture.screenshot("profile-fields-$stage-personal")
                compose.onNodeWithText("profile@example.test").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText(if (stage == "clear") "Не указан" else "+79990000000")
                    .performScrollTo().assertIsDisplayed()
                fixture.screenshot("profile-fields-$stage-contacts")
                if (stage != "clear") {
                    compose.onNodeWithText("Выйти").performScrollTo().performClick()
                }
            }
        }
    }
}

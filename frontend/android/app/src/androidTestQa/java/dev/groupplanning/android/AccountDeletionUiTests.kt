package dev.groupplanning.android

import android.content.Intent
import android.os.ParcelFileDescriptor
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class AccountDeletionUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private val device = UiDevice.getInstance(instrumentation)

    @Test fun largeTextAndSystemBackKeepAccount() {
        val original = shell("settings get system font_scale").trim()
        try {
            shell("settings put system font_scale 2.0")
            launch("account-large").use {
                waitFor("meetings-list")
                compose.onNode(hasContentDescription("Профиль:", substring = true)).performClick()
                compose.onNodeWithText("Удалить аккаунт").performClick()
                waitText("Удалить аккаунт?")
                compose.onNodeWithText("Удалить аккаунт").assertIsDisplayed()
                compose.onNodeWithText("Отмена").assertIsDisplayed()
                screenshot("account-large-text")
                device.pressBack()
                waitFor("meetings-list")
            }
        } finally {
            if (original == "null") {
                shell("settings delete system font_scale")
            } else {
                require(original.toFloatOrNull() != null)
                shell("settings put system font_scale $original")
            }
        }
    }

    private fun shell(command: String): String = ParcelFileDescriptor.AutoCloseInputStream(
        instrumentation.uiAutomation.executeShellCommand(command),
    ).bufferedReader().use { it.readText() }

    @Before fun configureFixture() {
        val path = checkNotNull(InstrumentationRegistry.getArguments().getString("fixturePath"))
        require(path.matches(Regex("/data/local/tmp/somewhere-android-ui-[0-9]+.json")))
        val descriptor = instrumentation.uiAutomation.executeShellCommand("cat $path")
        val content = ParcelFileDescriptor.AutoCloseInputStream(descriptor).bufferedReader().use {
            it.readText()
        }
        File(context.noBackupFilesDir, "ui-fixture.json").writeText(content)
    }

    @Test fun cancelThenDeleteThroughApi() {
        launch("account").use {
            waitFor("meetings-list")
            val profile = hasContentDescription("Профиль:", substring = true)
            compose.onNode(profile).performClick()
            compose.onNodeWithText("Удалить аккаунт").performClick()
            waitText("Удалить аккаунт?")
            screenshot("account-confirmation")
            compose.onNodeWithText("Отмена").performClick()
            waitFor("meetings-list")
            compose.onNode(profile).performClick()
            compose.onNodeWithText("Удалить аккаунт").performClick()
            waitText("Удалить аккаунт?")
            compose.onNodeWithText("Удалить аккаунт").performClick()
            waitText("Аккаунт удалён")
            assertTrue(compose.onAllNodes(profile).fetchSemanticsNodes().isEmpty())
            screenshot("account-deleted")
        }
    }

    private fun launch(scenario: String): ActivityScenario<MainActivity> = ActivityScenario.launch(
        Intent(context, MainActivity::class.java).putExtra("scenario", scenario),
    )

    private fun waitFor(tag: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasTestTag(tag)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.waitForIdle()
    }

    private fun waitText(text: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasText(text)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.waitForIdle()
    }

    private fun screenshot(name: String) {
        compose.waitForIdle()
        device.waitForIdle(2_000)
        val output =
            checkNotNull(
                InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
            )
        val directory = File(output).apply { mkdirs() }
        check(device.takeScreenshot(File(directory, "$name.png")))
    }
}

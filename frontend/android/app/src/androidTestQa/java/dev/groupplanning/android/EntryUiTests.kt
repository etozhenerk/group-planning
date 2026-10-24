package dev.groupplanning.android

import android.content.Intent
import android.os.ParcelFileDescriptor
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
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
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.brand.BrandMotion
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class EntryUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private val device = UiDevice.getInstance(instrumentation)

    @Before fun configureFixture() {
        val path = checkNotNull(InstrumentationRegistry.getArguments().getString("fixturePath"))
        require(path.matches(Regex("/data/local/tmp/somewhere-android-ui-[0-9]+.json")))
        val descriptor = instrumentation.uiAutomation.executeShellCommand("cat $path")
        val content = ParcelFileDescriptor.AutoCloseInputStream(descriptor).bufferedReader().use {
            it.readText()
        }
        File(context.noBackupFilesDir, "ui-fixture.json").writeText(content)
    }

    @Test fun onboardingSlidesBackSkipAndLogin() {
        launch("onboarding").use { activity ->
            waitFor("onboarding")
            screenshot("onboarding-1")
            for (page in 1..4) {
                compose.onNodeWithTag("onboarding-progress").performSemanticsAction(
                    SemanticsActions.SetProgress,
                ) { it(page.toFloat()) }
                compose.waitForIdle()
                screenshot("onboarding-${page + 1}")
            }
            device.pressBack()
            screenshot("onboarding-back")
            compose.waitUntil(5_000) {
                compose.onAllNodesWithContentDescription("Далее").fetchSemanticsNodes().isNotEmpty()
            }
            compose.onNodeWithContentDescription("Далее").assertIsDisplayed()
            compose.onNodeWithText("Пропустить").performClick()
            compose.waitForIdle()
            compose.onNodeWithContentDescription("Попробовать").performClick()
            waitText("Не удалось войти")
            compose.onNodeWithText("Понятно").performClick()
            compose.waitForIdle()
            device.waitForIdle(2_000)
            activity.recreate()
            waitFor("onboarding")
            compose.onNodeWithContentDescription("Попробовать").assertIsDisplayed()
        }
    }

    @Test fun emptyListAndPersistentDraft() {
        launch("draft").use {
            waitFor("meetings-list")
            waitText("С чего начнём?")
            compose.onAllNodesWithText("Создать встречу").assertCountEquals(1)
            screenshot("empty")
            compose.onNodeWithText("Создать встречу").performClick()
            waitFor("create-form")
            compose.onNodeWithContentDescription("Название").performTextInput("Настолки")
            device.pressBack()
            device.pressBack()
            compose.onNodeWithText("Сохранить и выйти").performClick()
            waitFor("meetings-list")
        }
        launch("draft").use {
            waitText("С чего начнём?")
            compose.onNodeWithText("Создать встречу").performClick()
            waitFor("create-form")
            compose.onNodeWithContentDescription("Название").assertTextContains("Настолки")
            screenshot("draft")
        }
    }

    @Test fun listFailureCanRetry() {
        launch("list-error").use {
            waitText("Не удалось получить встречи")
            screenshot("list-error")
            compose.onNodeWithText("Повторить").performClick()
            waitText("С чего начнём?")
        }
    }

    @Test fun lostCreateResponseRetriesSameMeeting() {
        launch("lost-create").use { activity ->
            waitText("С чего начнём?")
            compose.onNodeWithText("Создать встречу").performClick()
            waitFor("create-form")
            compose.onNodeWithTag("create-submit").performScrollTo().performClick()
            compose.onNodeWithTag("create-problem").assertIsDisplayed()
            compose.onNodeWithContentDescription("Название").performScrollTo()
                .performTextInput("Вечер настольных игр")
            device.pressBack()
            compose.onNodeWithContentDescription("Дата").performScrollTo().performClick()
            screenshot("date-picker")
            compose.onNodeWithTag("date-confirm").performClick()
            compose.onNodeWithContentDescription("Время").performScrollTo().performClick()
            screenshot("time-picker")
            compose.onNodeWithTag("time-confirm").performClick()
            screenshot("create")
            compose.onNodeWithTag("create-submit").performScrollTo().performClick()
            waitText("Повторить сохранение")
            screenshot("create-retry")
            activity.recreate()
            waitText("Повторить сохранение")
            compose.onNodeWithTag("create-submit").performScrollTo().performClick()
            waitText("Вечер настольных игр")
            compose.waitUntil(10_000) {
                compose.onAllNodesWithContentDescription(
                    "Информация о встрече",
                ).fetchSemanticsNodes().isNotEmpty()
            }
            screenshot("created")
            device.pressBack()
            waitFor("meetings-list")
            waitText("Вечер настольных игр")
            compose.onAllNodesWithText("Вечер настольных игр").assertCountEquals(1)
            compose.onAllNodesWithContentDescription("Создать встречу").assertCountEquals(1)
            screenshot("list")
        }
    }

    @Test fun largeTextKeepsNavigationAndPickersReachable() {
        val original = shell("settings get system font_scale").trim()
        try {
            shell("settings put system font_scale 1.8")
            launch("onboarding").use {
                waitFor("onboarding")
                screenshot("onboarding-large")
                compose.onNodeWithText("Пропустить").performClick()
                compose.waitForIdle()
                compose.onNodeWithContentDescription("Попробовать").assertIsDisplayed()
                screenshot("onboarding-last-large")
            }
            launch("empty").use {
                waitText("С чего начнём?")
                compose.onNodeWithText("Создать встречу").performScrollTo().performClick()
                waitFor("create-form")
                compose.onNodeWithContentDescription("Дата").performScrollTo().performClick()
                screenshot("date-large")
                compose.onNodeWithTag("date-confirm").performClick()
                compose.onNodeWithContentDescription("Время").performScrollTo().performClick()
                screenshot("time-large")
                compose.onNodeWithTag("time-confirm").performClick()
                compose.onNodeWithTag("create-submit").performScrollTo().assertIsDisplayed()
                screenshot("create-large")
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

    @Test fun launchCompletesOnceAcrossRecreationAndBackground() {
        launch("onboarding").use { activity ->
            lateinit var model: AppViewModel
            activity.onActivity { model = ViewModelProvider(it)[AppViewModel::class.java] }
            waitFor("onboarding")
            assertEquals(BrandMotion.DURATION_NANOS, model.elapsed.value)
            activity.recreate()
            activity.onActivity {
                assertSame(model, ViewModelProvider(it)[AppViewModel::class.java])
            }
            activity.moveToState(Lifecycle.State.CREATED)
            activity.moveToState(Lifecycle.State.RESUMED)
            waitFor("onboarding")
            assertEquals(BrandMotion.DURATION_NANOS, model.elapsed.value)
            compose.onAllNodes(hasTestTag("launch")).assertCountEquals(0)
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

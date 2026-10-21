package dev.groupplanning.android

import android.content.Intent
import android.net.Uri
import android.os.ParcelFileDescriptor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import java.io.File

internal class InvitationUiFixture(private val compose: ComposeTestRule) {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    val context = instrumentation.targetContext
    val device: UiDevice = UiDevice.getInstance(instrumentation)
    val token = "QUFBQUFBQUFBQUFBQUFBQQ"

    fun configure() {
        val path = checkNotNull(InstrumentationRegistry.getArguments().getString("fixturePath"))
        require(path.matches(Regex("/data/local/tmp/somewhere-android-ui-[0-9]+.json")))
        File(context.noBackupFilesDir, "ui-fixture.json").writeText(shell("cat $path"))
    }

    fun launch(scenario: String, token: String? = null): ActivityScenario<MainActivity> =
        ActivityScenario.launch(
            Intent(context, MainActivity::class.java).apply {
                putExtra("scenario", scenario)
                token?.let { data = Uri.parse("group-planning-android-qa://i/$it") }
            },
        )

    fun waitTag(tag: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasTestTag(tag)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.waitForIdle()
    }

    fun waitText(text: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasText(text)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.waitForIdle()
    }

    fun shell(command: String): String = ParcelFileDescriptor.AutoCloseInputStream(
        instrumentation.uiAutomation.executeShellCommand(command),
    ).bufferedReader().use { it.readText() }

    fun screenshot(name: String) {
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

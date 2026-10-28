package dev.groupplanning.android

import android.animation.ValueAnimator
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.ParcelFileDescriptor
import android.provider.Settings
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.printToString
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import java.io.File
import java.time.Instant
import java.util.TimeZone
import org.json.JSONArray
import org.json.JSONObject

internal class InvitationUiFixture(private val compose: ComposeTestRule) {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    val context = instrumentation.targetContext
    val device: UiDevice = UiDevice.getInstance(instrumentation)
    val token = "QUFBQUFBQUFBQUFBQUFBQQ"

    fun configure() {
        checkNotNull(context.getExternalFilesDir(null))
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

    fun waitAbsent(tag: String) {
        compose.waitUntil(15_000) {
            compose.onAllNodes(hasTestTag(tag)).fetchSemanticsNodes().isEmpty()
        }
        compose.waitForIdle()
    }

    fun waitText(text: String) {
        try {
            compose.waitUntil(15_000) {
                compose.onAllNodes(hasText(text)).fetchSemanticsNodes().isNotEmpty()
            }
            compose.waitForIdle()
        } catch (failure: AssertionError) {
            println("SOMEWHERE_WAIT_TEXT_FAILURE=$text\n" + compose.onRoot().printToString())
            screenshot("wait-text-failure-${System.currentTimeMillis()}")
            throw failure
        }
    }

    fun shell(command: String): String = ParcelFileDescriptor.AutoCloseInputStream(
        instrumentation.uiAutomation.executeShellCommand(command),
    ).bufferedReader().use { it.readText() }

    fun screenshot(name: String) {
        compose.mainClock.advanceTimeBy(300)
        compose.waitForIdle()
        device.waitForIdle(2_000)
        instrumentation.waitForIdleSync()
        Thread.sleep(500)
        val output =
            checkNotNull(
                InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
            )
        val directory = File(output).apply {
            check(mkdirs() || isDirectory) { "Screenshot directory is unavailable: $output" }
        }
        val captureStartedAt = Instant.now().toString()
        val image = File(directory, "$name.png")
        check(device.takeScreenshot(image))
        val capturedAt = Instant.now().toString()
        saveCaptureMetadata(image, captureStartedAt, capturedAt)
    }

    private fun saveCaptureMetadata(image: File, startedAt: String, capturedAt: String) {
        val bitmap = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(image.absolutePath, bitmap)
        check(bitmap.outWidth > 0 && bitmap.outHeight > 0) { "Screenshot bounds are unavailable" }
        val configuration = context.resources.configuration
        val metrics = context.resources.displayMetrics
        val metadata = JSONObject().apply {
            put("schemaVersion", 1)
            put("image", image.name)
            put("captureStartedAt", startedAt)
            put("capturedAt", capturedAt)
            put(
                "android",
                JSONObject().apply {
                    put("release", Build.VERSION.RELEASE)
                    put("apiLevel", Build.VERSION.SDK_INT)
                    put("codename", Build.VERSION.CODENAME)
                    put("buildId", Build.ID)
                    put("buildDisplay", Build.DISPLAY)
                    put("incremental", Build.VERSION.INCREMENTAL)
                    put("deviceModel", Build.MODEL)
                    put("vmName", System.getProperty("java.vm.name"))
                    put("vmVersion", System.getProperty("java.vm.version"))
                },
            )
            put(
                "imageBoundsPx",
                JSONObject().apply {
                    put("left", 0)
                    put("top", 0)
                    put("width", bitmap.outWidth)
                    put("height", bitmap.outHeight)
                },
            )
            put(
                "display",
                JSONObject().apply {
                    put("widthPx", device.displayWidth)
                    put("heightPx", device.displayHeight)
                    put("rotation", device.displayRotation)
                    put("density", metrics.density.toDouble())
                    put("densityDpi", metrics.densityDpi)
                    put("configurationWidthDp", configuration.screenWidthDp)
                    put("configurationHeightDp", configuration.screenHeightDp)
                },
            )
            put("locales", JSONArray(configuration.locales.toLanguageTags().split(",")))
            put("timezone", TimeZone.getDefault().id)
            put("fontScale", configuration.fontScale.toDouble())
            put(
                "motion",
                JSONObject().apply {
                    listOf(
                        Settings.Global.WINDOW_ANIMATION_SCALE,
                        Settings.Global.TRANSITION_ANIMATION_SCALE,
                        Settings.Global.ANIMATOR_DURATION_SCALE,
                    ).forEach { setting ->
                        val actual = Settings.Global.getString(context.contentResolver, setting)
                        put(setting, actual?.toDoubleOrNull() ?: JSONObject.NULL)
                    }
                    put("animatorsEnabled", ValueAnimator.areAnimatorsEnabled())
                },
            )
            put("fonts", CaptureFontProbe.measure())
        }
        File(image.parentFile, "${image.nameWithoutExtension}.capture.json")
            .writeText(metadata.toString(2) + "\n")
    }
}

package dev.groupplanning.android

import android.content.Intent
import android.os.Debug
import android.os.SystemClock
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/** Performance uses the real Choreographer, without a Compose functional-test rule. */
class ChatScrollBaselineUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private val device = UiDevice.getInstance(instrumentation)
    private lateinit var output: File

    @Before fun configure() {
        val args = InstrumentationRegistry.getArguments()
        val path = checkNotNull(args.getString("fixturePath"))
        require(path.matches(Regex("/data/local/tmp/somewhere-android-ui-[0-9]+.json")))
        File(
            context.noBackupFilesDir,
            "ui-fixture.json",
        ).writeText(device.executeShellCommand("cat $path"))
        output = File(checkNotNull(args.getString("additionalTestOutputDir")))
        check(output.mkdirs() || output.isDirectory)
    }

    @After fun cleanup() {
        QaResponseGate.artificialRoundTripMillis = 0
    }

    @Test fun tenThousandMixedHeightEntriesFrameMemoryAndScrollBaseline() {
        val api = ChatReadLiveApi(context)
        val created = api.request(
            "empty",
            "meetings",
            "POST",
            JSONObject().put("title", "Baseline Android 10k")
                .put("starts_on", "2099-10-24").put("timezone", "Europe/Moscow"),
        )
        val id = created.getJSONObject("meeting").getString("id")
        val digest = MessageDigest.getInstance("SHA-256")
        repeat(10_000) { number ->
            val text = "$number: ${"Переменная высота строки. ".repeat(1 + number % 32)}"
            digest.update(text.toByteArray())
            val key = UUID.randomUUID().toString()
            api.request(
                "empty",
                "meetings/$id/messages",
                "POST",
                JSONObject().put("text", text).put("client_request_id", key),
            )
            if (number % 1000 == 999) {
                println("CHAT_BASELINE_SEED ${number + 1}")
                val title = "Подготовка $number: ${"длинная карточка ".repeat(8)}"
                digest.update(title.toByteArray())
                api.request(
                    "empty",
                    "meetings/$id/preparation-tasks",
                    "POST",
                    JSONObject().put("title", title).put("recipient_id", JSONObject.NULL),
                )
            }
        }
        QaResponseGate.artificialRoundTripMillis = 150
        ActivityScenario.launch<MainActivity>(
            Intent(context, MainActivity::class.java)
                .putExtra("scenario", "empty"),
        ).use { activity ->
            checkNotNull(
                device.wait(Until.findObject(By.textContains("Baseline Android 10k")), 15_000),
            ).click()
            assertTrue(device.wait(Until.hasObject(By.textStartsWith("9999: ")), 15_000))
            val frames = WindowFrameBaseline()
            val checkpoints = JSONArray()
            activity.onActivity { frames.start(it.window) }
            try {
                snapshot(checkpoints, "tail-start", 0)
                traverse("0: ", older = true, checkpoints)
                traverse("9999: ", older = false, checkpoints)
                device.takeScreenshot(File(output, "chat-baseline-tail-return.png"))
            } finally {
                activity.onActivity { frames.stop(it.window) }
                frames.close()
                val result = JSONObject().put("messages", 10_000).put("tasks", 10)
                    .put("templateSha256", digest.digest().joinToString("") { "%02x".format(it) })
                    .put("artificialHttpRoundTripMs", 150)
                    .put("driver", "UiAutomator, real Choreographer, device swipe steps=6")
                    .put("memoryScope", "Target plus instrumentation; fixed QA frame buffers")
                    .put("frames", frames.result()).put("checkpoints", checkpoints)
                File(output, "chat-scroll-baseline.json").writeText(result.toString(2))
            }
        }
    }

    private fun traverse(prefix: String, older: Boolean, checkpoints: JSONArray) {
        val deadline = SystemClock.elapsedRealtime() + 1_800_000
        var gestures = 0
        while (!device.hasObject(By.textStartsWith(prefix)) &&
            SystemClock.elapsedRealtime() < deadline
        ) {
            val x = device.displayWidth / 2
            val top = (device.displayHeight * 0.30).toInt()
            val bottom = (device.displayHeight * 0.75).toInt()
            device.swipe(x, if (older) top else bottom, x, if (older) bottom else top, 6)
            SystemClock.sleep(80)
            gestures += 1
            if (gestures % 10 == 0) snapshot(checkpoints, if (older) "older" else "newer", gestures)
        }
        assertTrue(
            "Actual endpoint must be visible: $prefix",
            device.hasObject(By.textStartsWith(prefix)),
        )
        snapshot(checkpoints, if (older) "oldest" else "tail-return", gestures)
    }

    private fun snapshot(samples: JSONArray, direction: String, gestures: Int) {
        val memory = Debug.MemoryInfo().apply { Debug.getMemoryInfo(this) }
        samples.put(
            JSONObject().put("direction", direction).put("gestures", gestures)
                .put("uptimeMs", SystemClock.elapsedRealtime()).put("pssKiB", memory.totalPss)
                .put("javaPssKiB", memory.dalvikPss).put("nativePssKiB", memory.nativePss),
        )
        println("CHAT_BASELINE_REAL $direction gestures=$gestures PSS=${memory.totalPss}")
    }
}

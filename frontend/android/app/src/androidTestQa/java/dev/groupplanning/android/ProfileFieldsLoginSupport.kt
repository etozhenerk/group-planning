package dev.groupplanning.android

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import androidx.test.platform.app.InstrumentationRegistry
import com.yandex.authsdk.YandexAuthToken

// Use only around a UI login in the profile-fields QA scenario.
// The SDK result is synthetic; the app still performs the real HTTP start/exchange.
internal class ProfileFieldsLoginSupport(stage: String) : AutoCloseable {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val monitor: Instrumentation.ActivityMonitor

    init {
        require(stage in setOf("full", "partial", "clear"))
        val result = Intent().putExtra(
            "com.yandex.authsdk.EXTRA_TOKEN",
            YandexAuthToken("profile-fields-$stage", 3600),
        )
        monitor = instrumentation.addMonitor(
            "com.yandex.authsdk.internal.AuthSdkActivity",
            Instrumentation.ActivityResult(Activity.RESULT_OK, result),
            true,
        )
    }

    override fun close() {
        instrumentation.removeMonitor(monitor)
    }
}

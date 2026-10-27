package dev.groupplanning.android

import android.animation.ValueAnimator
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import dev.groupplanning.android.ui.motion.rememberMotionEnabled
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@SdkSuppress(minSdkVersion = 33)
class MotionPreferenceUiTests {
    @get:Rule val compose = createComposeRule()

    private var observed: Boolean? = null
    private val mounted = mutableStateOf(true)

    @Test fun preferenceTracksExplicitScaleAndRestoration() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val resolver = instrumentation.targetContext.contentResolver
        val device = UiDevice.getInstance(instrumentation)
        val original = Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE)
        compose.setContent {
            if (mounted.value) {
                val motion = rememberMotionEnabled()
                SideEffect { observed = motion }
            }
        }
        compose.waitForIdle()
        val scale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
        val expected = scale > 0
        val powerSave = instrumentation.targetContext.getSystemService(PowerManager::class.java)
            .isPowerSaveMode
        println(
            "MOTION_PROBE time=${java.time.Instant.now()} initial setting=$original " +
                "effectiveScale=$scale expected=$expected " +
                "powerSave=$powerSave " +
                "animator=${ValueAnimator.areAnimatorsEnabled()} " +
                "animatorScale=${ValueAnimator.getDurationScale()} localMotion=$observed",
        )
        try {
            device.executeShellCommand("settings put global animator_duration_scale 1")
            compose.waitUntil(5_000) { ValueAnimator.areAnimatorsEnabled() && observed == true }
            println(
                "MOTION_PROBE time=${java.time.Instant.now()} explicitNormal setting=" +
                    Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE) +
                    " animator=${ValueAnimator.areAnimatorsEnabled()} " +
                    "animatorScale=${ValueAnimator.getDurationScale()} localMotion=$observed",
            )
            device.executeShellCommand("settings put global animator_duration_scale 0")
            compose.waitUntil(5_000) { !ValueAnimator.areAnimatorsEnabled() && observed == false }
            device.executeShellCommand("settings put global animator_duration_scale 1")
            compose.waitUntil(5_000) { ValueAnimator.areAnimatorsEnabled() && observed == true }
            compose.runOnIdle { mounted.value = false }
            device.executeShellCommand("settings put global animator_duration_scale 0")
            compose.waitUntil(5_000) { !ValueAnimator.areAnimatorsEnabled() }
            compose.runOnIdle { mounted.value = true }
            compose.waitUntil(5_000) { !ValueAnimator.areAnimatorsEnabled() && observed == false }
            println(
                "MOTION_PROBE time=${java.time.Instant.now()} explicitReduced setting=0 " +
                    "animator=${ValueAnimator.areAnimatorsEnabled()} " +
                    "animatorScale=${ValueAnimator.getDurationScale()} localMotion=$observed",
            )
            device.executeShellCommand("settings put global animator_duration_scale 1")
            compose.waitUntil(5_000) { ValueAnimator.areAnimatorsEnabled() && observed == true }
        } finally {
            println(
                "MOTION_PROBE time=${java.time.Instant.now()} beforeRestore setting=" +
                    Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE) +
                    " animator=${ValueAnimator.areAnimatorsEnabled()} " +
                    "animatorScale=${ValueAnimator.getDurationScale()} localMotion=$observed",
            )
            device.executeShellCommand(
                if (original == null) {
                    "settings delete global animator_duration_scale"
                } else {
                    "settings put global animator_duration_scale $original"
                },
            )
        }
        compose.waitUntil(5_000) { observed == ValueAnimator.areAnimatorsEnabled() }
        assertEquals(
            original,
            Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE),
        )
        println(
            "MOTION_PROBE restored setting=" +
                Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE) +
                " animator=${ValueAnimator.areAnimatorsEnabled()} localMotion=$observed",
        )
    }
}

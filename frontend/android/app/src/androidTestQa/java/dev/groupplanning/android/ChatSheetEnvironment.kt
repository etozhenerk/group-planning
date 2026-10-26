package dev.groupplanning.android

import android.accessibilityservice.AccessibilityServiceInfo
import android.graphics.Rect
import android.os.Build
import android.view.accessibility.AccessibilityWindowInfo
import android.view.inspector.WindowInspector
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.platform.app.InstrumentationRegistry

internal class ChatSheetEnvironment(private val fixture: InvitationUiFixture) {
    private val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
    private var originalFlags: Int? = null
    private val originalSettings = mutableMapOf<Pair<String, String>, String>()
    private val animationSettings = listOf(
        "window_animation_scale",
        "transition_animation_scale",
        "animator_duration_scale",
    )

    fun prepare() {
        (
            listOf("system" to "font_scale", "secure" to "show_ime_with_hard_keyboard") +
                animationSettings.map { "global" to it }
            )
            .forEach { key ->
                originalSettings[key] = fixture.shell("settings get ${key.first} ${key.second}")
                    .trim()
            }
        fixture.shell("settings put secure show_ime_with_hard_keyboard 1")
        val info = automation.serviceInfo
        originalFlags = info.flags
        info.flags = info.flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        automation.serviceInfo = info
    }

    fun disableMotion() {
        animationSettings.forEach { setting ->
            fixture.shell("settings put global $setting 0")
            check(fixture.shell("settings get global $setting").trim().toFloat() == 0f)
        }
    }

    fun restore() {
        try {
            originalSettings.forEach { (key, value) ->
                if (value == "null") {
                    fixture.shell("settings delete ${key.first} ${key.second}")
                } else {
                    require(value.toFloatOrNull() != null)
                    fixture.shell("settings put ${key.first} ${key.second} $value")
                }
            }
        } finally {
            originalFlags?.let { flags ->
                val info = automation.serviceInfo
                info.flags = flags
                automation.serviceInfo = info
            }
        }
    }

    fun keyboardBounds(): Rect? {
        if (automation.windows.none {
                it.type == AccessibilityWindowInfo.TYPE_INPUT_METHOD
            }
        ) {
            return null
        }
        check(Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
        var bounds: Rect? = null
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            val root = WindowInspector.getGlobalWindowViews().lastOrNull {
                it.isAttachedToWindow && it.hasWindowFocus()
            } ?: return@runOnMainSync
            val insets = ViewCompat.getRootWindowInsets(root) ?: return@runOnMainSync
            if (!insets.isVisible(WindowInsetsCompat.Type.ime())) return@runOnMainSync
            val bottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            if (bottom <= insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom) {
                return@runOnMainSync
            }
            val location = IntArray(2)
            root.getLocationOnScreen(location)
            bounds = Rect(
                location[0],
                location[1] + root.height - bottom,
                location[0] + root.width,
                location[1] + root.height,
            )
        }
        return bounds
    }
}

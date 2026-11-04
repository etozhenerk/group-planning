package dev.groupplanning.android

import android.app.UiAutomation
import android.graphics.Rect
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.accessibility.AccessibilityNodeInfo
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class TalkBackActivationUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun touchscreenDoubleTapActivatesTheFocusedCreateButton() {
        fixture.launch("empty").use { activity ->
            fixture.waitTag("meetings-list")
            NativeTalkBack.use(fixture, activity) { automation ->
                var target = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                    .first { it.text?.toString() == "Создать встречу" }
                while (!target.isClickable) target = checkNotNull(target.parent)
                val bounds = Rect()
                target.getBoundsInScreen(bounds)
                touch(automation, bounds.centerX().toFloat(), bounds.centerY().toFloat())
                NativeTalkBack.await {
                    automation.rootInActiveWindow?.findFocus(
                        AccessibilityNodeInfo.FOCUS_ACCESSIBILITY,
                    )?.let { focused ->
                        NativeTalkBack.walk(focused).any {
                            it.text?.toString() == "Создать встречу"
                        }
                    } == true
                }
                SystemClock.sleep(400)
                NativeTalkBack.capture(automation, "talkback-before-double-tap")
                repeat(2) { touch(automation, 30f, 140f) }
                NativeTalkBack.await {
                    automation.rootInActiveWindow?.let { root ->
                        NativeTalkBack.walk(root).any { it.text?.toString() == "Новая встреча" }
                    } == true
                }
                NativeTalkBack.capture(automation, "talkback-after-double-tap")
            }
        }
    }

    private fun touch(automation: UiAutomation, x: Float, y: Float) {
        val down = SystemClock.uptimeMillis()
        for (action in listOf(MotionEvent.ACTION_DOWN, MotionEvent.ACTION_UP)) {
            val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, x, y, 0)
            event.source = InputDevice.SOURCE_TOUCHSCREEN
            try {
                assertTrue(automation.injectInputEvent(event, true))
            } finally {
                event.recycle()
            }
            SystemClock.sleep(30)
        }
    }
}

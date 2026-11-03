package dev.groupplanning.android

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.filters.SdkSuppress
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.FixMethodOrder
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.MethodSorters

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class ProfileVibeAccessibilityUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test
    @SdkSuppress(minSdkVersion = 36)
    fun aProfileAtLargeTextAllowsRealTalkBackFocusOnPrivateFields() = largeText {
        fixture.launch("memories").use { activity ->
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
            compose.onNodeWithText("Почта").performScrollTo().assertIsDisplayed()
            NativeTalkBack.use(fixture, activity) { automation ->
                val node = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                    .first { it.text?.toString()?.contains("Почта") == true }
                assertTrue(node.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS))
                val focused = automation.rootInActiveWindow?.findFocus(
                    AccessibilityNodeInfo.FOCUS_ACCESSIBILITY,
                )
                assertTrue(focused?.text?.toString()?.contains("Почта") == true)
                NativeTalkBack.capture(automation, "profile-large-talkback")
            }
        }
    }

    @Test
    @SdkSuppress(minSdkVersion = 36)
    fun bVibeTalkBackCustomNextWorksAtLargeTextWithoutMotion() = largeText {
        fixture.launch("memories").use { activity ->
            openAlbum()
            activity.onActivity {
                it.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }
            try {
                compose.waitUntil(10_000) {
                    var landscape = false
                    activity.onActivity {
                        landscape = it.resources.configuration.orientation ==
                            Configuration.ORIENTATION_LANDSCAPE
                    }
                    landscape
                }
                compose.onNodeWithTag("photo-stack").performScrollTo()
                NativeTalkBack.use(fixture, activity) { automation ->
                    val node = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                        .first { it.contentDescription?.toString()?.contains("1 из 3") == true }
                    assertTrue(node.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS))
                    val next = node.actionList.single {
                        it.label?.toString() == fixture.context.getString(R.string.photo_next)
                    }
                    assertTrue(node.performAction(next.id))
                    compose.mainClock.advanceTimeBy(300)
                    val current = NativeTalkBack.walk(checkNotNull(automation.rootInActiveWindow))
                    assertTrue(
                        current.any {
                            it.contentDescription?.toString()?.contains("2 из 3") == true
                        },
                    )
                    NativeTalkBack.capture(automation, "vibe-large-landscape-talkback-next")
                }
            } finally {
                activity.onActivity {
                    it.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }
            }
        }
    }

    @Test fun zRevokedSessionCannotKeepCachedAlbumVisible() {
        fixture.launch("vibe-revocation-owner").use {
            openAlbum()
            val api = ChatReadLiveApi(fixture.context)
            api.request("vibe-revocation-owner", "me", "DELETE")
            fixture.device.pressBack()
            fixture.waitTag("onboarding")
            compose.onNodeWithTag("photo-stack").assertDoesNotExist()
            for (actor in listOf("design", "feed-owner")) {
                assertTrue(api.request(actor, "me").has("user"))
            }
            fixture.screenshot("vibe-revoked-session")
        }
    }

    private fun openAlbum() {
        fixture.waitTag("meetings-list")
        compose.onNodeWithText("Прошедшие").performClick()
        fixture.waitText("Суббота у озера")
        compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
        fixture.waitText("Открыть вайб")
        compose.onNodeWithText("Открыть вайб").performClick()
        fixture.waitText("1 / 3")
    }

    private fun largeText(block: () -> Unit) {
        val scale = fixture.shell("settings get system font_scale").trim()
        val motion = fixture.shell("settings get global animator_duration_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.shell("settings put global animator_duration_scale 0")
            block()
        } finally {
            for ((namespace, key, value) in listOf(
                Triple("system", "font_scale", scale),
                Triple("global", "animator_duration_scale", motion),
            )) {
                if (value == "null") {
                    fixture.shell("settings delete $namespace $key")
                } else {
                    require(value.toFloatOrNull() != null)
                    fixture.shell("settings put $namespace $key $value")
                }
            }
        }
    }
}

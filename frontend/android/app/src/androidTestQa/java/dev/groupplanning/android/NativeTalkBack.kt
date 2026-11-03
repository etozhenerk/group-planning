package dev.groupplanning.android

import android.app.UiAutomation
import android.content.Context
import android.content.Intent
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.Configurator
import java.io.File
import org.junit.Assert.assertTrue

internal object NativeTalkBack {
    fun use(
        fixture: InvitationUiFixture,
        activity: ActivityScenario<MainActivity>,
        block: (UiAutomation) -> Unit,
    ) {
        val configurator = Configurator.getInstance()
        val originalFlags = configurator.uiAutomationFlags
        val originalServices = shell(
            "settings get secure enabled_accessibility_services",
        ).trim()
        val originalEnabled = shell("settings get secure accessibility_enabled").trim()
        val notifications = shell("dumpsys package com.google.android.marvin.talkback")
            .lineSequence().first { it.contains("POST_NOTIFICATIONS: granted=") }
        val service = "com.google.android.marvin.talkback/" +
            "com.google.android.marvin.talkback.TalkBackService"
        require(originalServices == "null" || originalServices.isEmpty()) {
            "This test must not replace another enabled accessibility service"
        }
        try {
            configurator.uiAutomationFlags =
                UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES
            val automation = InstrumentationRegistry.getInstrumentation().getUiAutomation(
                UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES,
            )
            shell("settings put secure enabled_accessibility_services $service")
            shell("settings put secure accessibility_enabled 1")
            val manager = fixture.context.getSystemService(
                Context.ACCESSIBILITY_SERVICE,
            ) as AccessibilityManager
            await { manager.isEnabled && manager.isTouchExplorationEnabled }
            val permission = automation.rootInActiveWindow
            if (permission?.packageName?.toString()?.contains("permissioncontroller") == true) {
                val deny = walk(permission).firstOrNull {
                    it.text?.toString() in setOf("Don’t allow", "Don't allow", "Не разрешать")
                }
                checkNotNull(deny).performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            // First activation can launch TalkBack's own permission/tutorial activity.
            // Return to the existing form without accepting or changing those permissions.
            activity.onActivity {
                it.startActivity(
                    Intent(it, MainActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),
                )
            }
            try {
                block(automation)
            } catch (failure: Throwable) {
                runCatching {
                    capture(automation, "native-talkback-failure")
                    File(outputDirectory(), "native-talkback-failure.txt").writeText(
                        walk(checkNotNull(automation.rootInActiveWindow)).joinToString("\n") {
                            "${it.className} text=${it.text} desc=${it.contentDescription}" +
                                " click=${it.isClickable} actions=${it.actionList}"
                        },
                    )
                }
                throw failure
            }
        } finally {
            shell("settings delete secure enabled_accessibility_services")
            if (originalEnabled == "null") {
                shell("settings delete secure accessibility_enabled")
            } else {
                shell("settings put secure accessibility_enabled $originalEnabled")
            }
            // Restore flags after declining TalkBack's first-run notification prompt.
            val flags = "com.google.android.marvin.talkback " +
                "android.permission.POST_NOTIFICATIONS"
            shell("pm clear-permission-flags $flags user-set user-fixed")
            if (notifications.contains("USER_SET")) {
                shell("pm set-permission-flags $flags user-set")
            }
            if (notifications.contains("USER_FIXED")) {
                shell("pm set-permission-flags $flags user-fixed")
            }
            configurator.uiAutomationFlags = originalFlags
            assertTrue(
                shell("settings get secure enabled_accessibility_services").trim() ==
                    originalServices,
            )
        }
    }

    // A default getUiAutomation() reconnects with flags=0 and suppresses TalkBack.
    private fun shell(command: String): String = ParcelFileDescriptor.AutoCloseInputStream(
        InstrumentationRegistry.getInstrumentation().getUiAutomation(
            UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES,
        ).executeShellCommand(command),
    ).bufferedReader().use { it.readText() }

    fun await(condition: () -> Boolean) {
        val deadline = SystemClock.uptimeMillis() + 10_000
        while (!condition() && SystemClock.uptimeMillis() < deadline) {
            dismissLateNotificationPrompt()
            Thread.sleep(50)
        }
        assertTrue("TalkBack condition timed out", condition())
    }

    private fun dismissLateNotificationPrompt() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(
            UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES,
        )
        val root = automation.rootInActiveWindow ?: return
        if (root.packageName?.toString()?.contains("permissioncontroller") != true) return
        val nodes = walk(root)
        if (nodes.none {
                it.text?.toString()?.contains("Android Accessibility Suite") == true
            }
        ) {
            return
        }
        val deny = nodes.firstOrNull {
            it.text?.toString() in setOf("Don’t allow", "Don't allow", "Не разрешать")
        } ?: return
        if (deny.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
            val context = instrumentation.targetContext
            context.startActivity(
                Intent(context, MainActivity::class.java).addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
                ),
            )
        }
    }

    fun capture(automation: UiAutomation, name: String) {
        val directory = outputDirectory()
        val bitmap = checkNotNull(automation.takeScreenshot())
        try {
            File(directory, "$name.png").outputStream().use {
                assertTrue(bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it))
            }
        } finally {
            bitmap.recycle()
        }
    }

    private fun outputDirectory(): File = File(
        checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")),
    ).apply { mkdirs() }

    fun walk(root: AccessibilityNodeInfo): List<AccessibilityNodeInfo> = buildList {
        add(root)
        for (index in 0 until root.childCount) {
            root.getChild(index)?.let { addAll(walk(it)) }
        }
    }
}

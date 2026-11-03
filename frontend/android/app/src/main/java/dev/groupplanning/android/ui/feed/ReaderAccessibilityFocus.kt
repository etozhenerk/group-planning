package dev.groupplanning.android.ui.feed

import android.content.Context
import android.os.Build
import android.view.View
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.annotation.RequiresApi

internal object ReaderAccessibilityFocus {
    fun restore(view: View) {
        val manager = view.context.getSystemService(Context.ACCESSIBILITY_SERVICE)
            as? AccessibilityManager ?: return
        if (!manager.isTouchExplorationEnabled || Build.VERSION.SDK_INT < 34) return
        restoreToInputTarget(view)
    }

    @RequiresApi(34)
    private fun restoreToInputTarget(view: View) {
        val target = view.accessibilityNodeProvider?.findFocus(
            AccessibilityNodeInfo.FOCUS_INPUT,
        ) ?: return
        // Connect only this application's node; no external service or private virtual IDs.
        target.setQueryFromAppProcessEnabled(view, true)
        target.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS)
    }
}

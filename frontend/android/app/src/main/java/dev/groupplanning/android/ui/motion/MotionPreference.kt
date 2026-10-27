package dev.groupplanning.android.ui.motion

import android.animation.ValueAnimator
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.ContentObserver
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext

internal val LocalMotionEnabled = staticCompositionLocalOf { true }

@Composable
internal fun rememberMotionEnabled(): Boolean {
    val context = LocalContext.current
    var enabled by remember(context) {
        mutableStateOf(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ValueAnimator.areAnimatorsEnabled()
            } else {
                legacyMotionEnabled(context)
            },
        )
    }
    DisposableEffect(context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Settings observers may run before ValueAnimator updates its cached duration scale.
            // This listener runs on the main thread after that actual scale changes.
            val listener = ValueAnimator.DurationScaleChangeListener { scale ->
                enabled = scale > 0
            }
            ValueAnimator.registerDurationScaleChangeListener(listener)
            enabled = ValueAnimator.areAnimatorsEnabled()
            onDispose { ValueAnimator.unregisterDurationScaleChangeListener(listener) }
        } else {
            val resolver = context.contentResolver
            val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
                override fun onChange(selfChange: Boolean) {
                    enabled = legacyMotionEnabled(context)
                }
            }
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    enabled = legacyMotionEnabled(context)
                }
            }
            resolver.registerContentObserver(
                Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),
                false,
                observer,
            )
            context.registerReceiver(
                receiver,
                IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED),
            )
            enabled = legacyMotionEnabled(context)
            onDispose {
                resolver.unregisterContentObserver(observer)
                context.unregisterReceiver(receiver)
            }
        }
    }
    return enabled
}

private fun legacyMotionEnabled(context: Context): Boolean {
    val scale = Settings.Global.getFloat(
        context.contentResolver,
        Settings.Global.ANIMATOR_DURATION_SCALE,
        1f,
    )
    return scale > 0 && !context.getSystemService(PowerManager::class.java).isPowerSaveMode
}

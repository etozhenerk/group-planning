package dev.groupplanning.android.ui.theme

import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun SomewhereTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        typography = Typography(
            bodyLarge = TextStyle(fontSize = 15.sp, lineHeight = 22.5.sp),
            bodyMedium = TextStyle(fontSize = 13.sp, lineHeight = 19.5.sp),
            bodySmall = TextStyle(fontSize = 12.sp, lineHeight = 18.sp),
        ),
        colorScheme = darkColorScheme(
            primary = Palette.action,
            onPrimary = Palette.actionText,
            primaryContainer = Palette.accent,
            onPrimaryContainer = Palette.actionText,
            secondary = Palette.accent,
            secondaryContainer = Palette.message,
            onSecondaryContainer = Palette.text,
            background = Palette.background,
            onBackground = Palette.text,
            surface = Palette.surface,
            surfaceContainerHigh = Palette.surface,
            surfaceContainerHighest = Palette.message,
            onSurface = Palette.text,
            surfaceVariant = Palette.message,
            onSurfaceVariant = Palette.muted,
            outline = Palette.border,
            error = Palette.error,
        ),
        content = {
            CompositionLocalProvider(LocalMinimumInteractiveComponentSize provides 0.dp) {
                content()
            }
        },
    )
}

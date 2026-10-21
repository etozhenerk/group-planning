package dev.groupplanning.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

@Composable
internal fun SomewhereTheme(content: @Composable () -> Unit) {
    MaterialTheme(
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
        content = content,
    )
}

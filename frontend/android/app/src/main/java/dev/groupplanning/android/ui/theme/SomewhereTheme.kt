package dev.groupplanning.android.ui.theme

import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp

@Composable
internal fun SomewhereTheme(content: @Composable () -> Unit) {
    val lineHeightRatio = DesignTokens.typographyLineHeightBody

    MaterialTheme(
        typography = Typography(
            bodyLarge = TextStyle(
                fontSize = DesignTokens.typographySizeBody,
                lineHeight = DesignTokens.typographySizeBody * lineHeightRatio,
            ),
            bodyMedium = TextStyle(
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight = DesignTokens.typographySizeSmall * lineHeightRatio,
            ),
            bodySmall = TextStyle(
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight = DesignTokens.typographySizeCaption * lineHeightRatio,
            ),
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

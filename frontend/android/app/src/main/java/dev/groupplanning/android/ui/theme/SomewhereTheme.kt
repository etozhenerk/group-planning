package dev.groupplanning.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.colorResource
import dev.groupplanning.android.R

@Composable
internal fun SomewhereTheme(content: @Composable () -> Unit) {
    val colors = darkColorScheme(
        primary = colorResource(R.color.action),
        onPrimary = colorResource(R.color.action_text),
        background = colorResource(R.color.background),
        onBackground = colorResource(R.color.foreground),
        surface = colorResource(R.color.surface),
        onSurface = colorResource(R.color.foreground),
        onSurfaceVariant = colorResource(R.color.muted),
        error = colorResource(R.color.error),
    )

    MaterialTheme(colorScheme = colors, content = content)
}

package dev.groupplanning.android.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.colorResource
import dev.groupplanning.android.R

internal object Palette {
    val background: Color @Composable get() = colorResource(R.color.background)
    val surface: Color @Composable get() = colorResource(R.color.surface)
    val message: Color @Composable get() = colorResource(R.color.message)
    val text: Color @Composable get() = colorResource(R.color.foreground)
    val muted: Color @Composable get() = colorResource(R.color.muted)
    val accent: Color @Composable get() = colorResource(R.color.accent)
    val action: Color @Composable get() = colorResource(R.color.action)
    val actionText: Color @Composable get() = colorResource(R.color.action_text)
    val error: Color @Composable get() = colorResource(R.color.error)
    val border: Color @Composable get() = colorResource(R.color.border)
}

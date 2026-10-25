package dev.groupplanning.android.ui.components

import androidx.compose.runtime.staticCompositionLocalOf
import java.util.UUID

internal val LocalViewer = staticCompositionLocalOf<UUID?> { null }

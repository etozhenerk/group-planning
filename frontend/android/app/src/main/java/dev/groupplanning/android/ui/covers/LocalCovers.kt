package dev.groupplanning.android.ui.covers

import androidx.compose.runtime.staticCompositionLocalOf
import dev.groupplanning.android.data.repository.CoverRepository

internal val LocalCovers = staticCompositionLocalOf<CoverRepository?> { null }

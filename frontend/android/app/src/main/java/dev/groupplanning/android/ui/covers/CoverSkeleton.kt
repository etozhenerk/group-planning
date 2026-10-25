package dev.groupplanning.android.ui.covers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CoverSkeleton(modifier: Modifier = Modifier) {
    val label = stringResource(R.string.cover_loading)
    Box(
        modifier.fillMaxSize().background(Palette.message).testTag("cover-loading").semantics {
            contentDescription =
                label
        },
    )
}

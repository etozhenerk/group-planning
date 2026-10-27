package dev.groupplanning.android.ui.covers

import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.state.covers.CoverAccess
import dev.groupplanning.android.state.covers.CoverImageViewModel
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CoverImage(
    source: CoverSource,
    modifier: Modifier = Modifier,
    thumbnail: Boolean = false,
    thumbnailSize: Dp = DesignTokens.spaceS64,
    cornerRadius: Dp = DesignTokens.radiusCover,
) {
    val repository = LocalCovers.current
    val model =
        remember(source, repository, thumbnail) {
            CoverImageViewModel(source, repository, if (thumbnail) 256 else 1600)
        }
    DisposableEffect(model) { onDispose { model.stop() } }
    val state by model.state.collectAsStateWithLifecycle()
    val snapshot = repository?.sessions?.state?.collectAsStateWithLifecycle()?.value
    val allowed =
        state.access == null ||
            (
                source is CoverSource.Remote &&
                    snapshot != null &&
                    state.access == CoverAccess.from(snapshot, source.meeting)
                )
    val size = if (thumbnail) {
        Modifier.size(thumbnailSize)
    } else {
        Modifier.fillMaxWidth().aspectRatio(16f / 9f)
    }
    CoverPixels(
        state.bitmap.takeIf { allowed },
        state.loading && allowed,
        modifier.then(size).clip(RoundedCornerShape(cornerRadius)),
    )
}

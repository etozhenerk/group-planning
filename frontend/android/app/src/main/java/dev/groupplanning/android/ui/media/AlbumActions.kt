package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.state.album.AlbumDownloadState
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AlbumActions(
    state: AlbumDownloadState,
    hasPhotos: Boolean,
    add: () -> Unit,
    save: () -> Unit,
    cancel: () -> Unit,
    settings: () -> Unit,
    acknowledge: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (state == AlbumDownloadState.Revoked) return
    val action = when (state) {
        AlbumDownloadState.Preparing -> R.string.album_cancel
        AlbumDownloadState.Saving -> R.string.album_saving
        AlbumDownloadState.Failed, AlbumDownloadState.SaveFailed -> R.string.poll_retry
        AlbumDownloadState.PermissionRequired -> R.string.album_settings
        AlbumDownloadState.Partial -> R.string.album_acknowledge
        else -> R.string.album_save
    }
    val label = when (action) {
        R.string.album_save -> R.string.album_save_accessibility
        R.string.album_cancel -> R.string.album_cancel_accessibility
        else -> action
    }
    val feedback = when (state) {
        AlbumDownloadState.Saved -> R.string.album_saved
        AlbumDownloadState.Failed -> R.string.album_prepare_error
        AlbumDownloadState.SaveFailed -> R.string.album_save_error
        AlbumDownloadState.PermissionRequired -> R.string.album_permission
        AlbumDownloadState.Partial -> R.string.album_partial
        else -> null
    }
    Column(modifier) {
        Row(
            Modifier.fillMaxWidth().height(IntrinsicSize.Min).testTag("album-actions"),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            AlbumActionButton(
                stringResource(R.string.memories_add),
                stringResource(R.string.memories_add),
                { modifier, tint -> AppIcon(R.drawable.ic_plus, modifier, tint) },
                add,
                (if (hasPhotos) Modifier.weight(1f) else Modifier)
                    .fillMaxHeight().testTag("album-add"),
                primary = true,
            )
            if (hasPhotos) {
                AlbumActionButton(
                    stringResource(action),
                    stringResource(label),
                    { modifier, tint -> AlbumDownloadIcon(modifier, tint) },
                    {
                        when (state) {
                            AlbumDownloadState.Preparing -> cancel()
                            AlbumDownloadState.PermissionRequired -> settings()
                            AlbumDownloadState.Partial -> acknowledge()
                            else -> save()
                        }
                    },
                    Modifier.weight(1f).fillMaxHeight().testTag("album-save"),
                    busy = state == AlbumDownloadState.Preparing ||
                        state == AlbumDownloadState.Saving,
                    enabled = state != AlbumDownloadState.Saving,
                )
            }
        }
        feedback?.let {
            Text(
                stringResource(it),
                Modifier.padding(top = DesignTokens.spaceS12)
                    .testTag("album-save-feedback").semantics {
                        liveRegion = LiveRegionMode.Polite
                    },
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                color = if (state == AlbumDownloadState.Saved) Palette.muted else Palette.error,
            )
        }
    }
}

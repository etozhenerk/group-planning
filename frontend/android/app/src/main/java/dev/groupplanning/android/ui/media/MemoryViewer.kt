package dev.groupplanning.android.ui.media

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MemoryViewer(
    title: String,
    photos: List<MeetingMedia>,
    index: Int,
    select: (Int) -> Unit,
    model: MediaViewModel,
    close: () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().padding(bottom = DesignTokens.spaceS32).testTag("memory-viewer"),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(
                start = DesignTokens.spaceS20,
                end = DesignTokens.spaceS16,
                top = DesignTokens.componentMobileVibeViewerTopInset,
                bottom = DesignTokens.componentMobileVibeNavBottomGap,
            ),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    title,
                    fontSize = DesignTokens.componentMobileVibeViewerTitleSize.value.sp,
                    lineHeight = DesignTokens.componentMobileVibeViewerTitleLineHeight.value.sp,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    "${index + 1} / ${photos.size}",
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = Palette.muted,
                )
            }
            val label = stringResource(R.string.memory_viewer_close)
            IconButton(
                close,
                Modifier.size(DesignTokens.targetAndroid).background(
                    Palette.surface,
                    RoundedCornerShape(DesignTokens.componentMobileVibeActionRadius),
                ).semantics {
                    contentDescription =
                        label
                },
            ) {
                AppIcon(R.drawable.ic_close)
            }
        }
        PhotoStack(photos, index, select, model, {
        }, Modifier.fillMaxWidth().weight(1f), full = true)
    }
}

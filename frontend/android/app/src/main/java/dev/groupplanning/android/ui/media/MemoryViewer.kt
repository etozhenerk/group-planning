package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MemoryViewer(
    title: String,
    subtitle: String,
    photos: List<MeetingMedia>,
    index: Int,
    select: (Int) -> Unit,
    model: MediaViewModel,
    close: () -> Unit,
) {
    Column(Modifier.fillMaxSize().padding(bottom = 38.dp).testTag("memory-viewer")) {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(title, fontSize = 18.sp, lineHeight = 22.5.sp, fontWeight = FontWeight.Bold)
                Text(
                    listOf(subtitle.substringBefore(" · "), "${index + 1} / ${photos.size}")
                        .filter { it.isNotEmpty() }.joinToString(" · "),
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = Palette.muted,
                )
            }
            val label = stringResource(R.string.memory_viewer_close)
            IconButton(close, Modifier.size(44.dp).semantics { contentDescription = label }) {
                AppIcon(R.drawable.ic_close)
            }
        }
        PhotoStack(photos, index, select, model, {
        }, Modifier.fillMaxWidth().weight(1f), full = true)
    }
}

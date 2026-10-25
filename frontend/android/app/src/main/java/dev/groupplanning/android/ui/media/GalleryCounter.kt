package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun GalleryCounter(
    index: Int,
    count: Int,
    modifier: Modifier = Modifier,
    grid: (() -> Unit)? = null,
) {
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("${index + 1} / $count", fontSize = 12.sp, color = Palette.muted)
        grid?.let {
            val label = stringResource(R.string.memories_grid)
            IconButton(it, Modifier.size(36.dp)) {
                AppIcon(
                    R.drawable.ic_grid,
                    Modifier.size(18.dp).semantics {
                        contentDescription = label
                    },
                )
            }
        }
    }
}

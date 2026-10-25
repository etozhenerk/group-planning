package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.brand.BrandWordmark

@Composable
internal fun MeetingsHeader() {
    Row(Modifier.graphicsLayer().padding(start = 20.dp, end = 20.dp, top = 17.dp)) {
        BrandWordmark(compact = true)
    }
}

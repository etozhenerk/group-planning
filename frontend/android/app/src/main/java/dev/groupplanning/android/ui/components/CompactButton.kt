package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CompactButton(
    title: String,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
    busy: Boolean = false,
    icon: Int? = null,
    click: () -> Unit,
) {
    Surface(
        click,
        modifier.defaultMinSize(minHeight = 46.dp),
        enabled = enabled && !busy,
        shape = RoundedCornerShape(13.dp),
        color = if (primary) Palette.action else Color.Transparent,
        contentColor = if (primary) Palette.actionText else Palette.text,
        border = if (primary) null else BorderStroke(1.dp, Color(0x20ffffff)),
    ) {
        Box(
            Modifier.padding(horizontal = 18.dp, vertical = 12.dp),
            contentAlignment = Alignment.Center,
        ) {
            if (busy) {
                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                ) {
                    icon?.let { AppIcon(it, Modifier.size(22.dp)) }
                    Text(title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

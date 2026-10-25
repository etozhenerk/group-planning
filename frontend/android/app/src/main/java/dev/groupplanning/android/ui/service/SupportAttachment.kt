package dev.groupplanning.android.ui.service

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportAttachment(enabled: Boolean, select: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().drawBehind {
            drawRoundRect(
                Color(0x26ffffff),
                cornerRadius = CornerRadius(15.dp.toPx()),
                style = Stroke(
                    1.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(
                        floatArrayOf(4.dp.toPx(), 4.dp.toPx()),
                    ),
                ),
            )
        }.clickable(enabled = enabled, onClick = select).padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(13.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AppIcon(R.drawable.ic_photo, Modifier.size(23.dp), tint = Palette.accent)
        Column {
            Text(
                stringResource(R.string.support_screenshot),
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
            )
            Text(
                stringResource(R.string.support_file_hint),
                fontSize = 11.sp,
                color = Palette.muted,
                modifier = Modifier.padding(top = 3.dp),
            )
        }
    }
}

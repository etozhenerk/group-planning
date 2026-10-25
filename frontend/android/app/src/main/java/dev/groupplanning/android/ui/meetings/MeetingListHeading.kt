package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingListHeading(showCreate: Boolean, scrolled: Boolean, create: () -> Unit) {
    val label = stringResource(R.string.meetings_create_accessible)
    Row(
        Modifier.fillMaxWidth().zIndex(1f).testTag("meetings-heading")
            .drawBehind {
                if (scrolled) {
                    val depth = 20.dp.toPx()
                    drawRect(
                        Brush.verticalGradient(
                            listOf(Color.Black.copy(alpha = 0.32f), Color.Transparent),
                            startY = size.height,
                            endY = size.height + depth,
                        ),
                        topLeft = Offset(0f, size.height),
                        size = Size(size.width, depth),
                    )
                }
            }
            .background(
                Palette.background,
                RoundedCornerShape(
                    bottomStart = if (scrolled) 18.dp else 0.dp,
                    bottomEnd = if (scrolled) 18.dp else 0.dp,
                ),
            ).padding(start = 20.dp, end = 20.dp, top = 28.dp, bottom = 24.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            stringResource(R.string.meetings_title),
            Modifier.weight(1f).semantics { heading() },
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-0.9).sp,
            lineHeight = 32.2.sp,
        )
        if (showCreate) {
            Surface(
                onClick = create,
                modifier = Modifier.defaultMinSize(44.dp, 44.dp).semantics {
                    contentDescription = label
                },
                shape = RoundedCornerShape(13.dp),
                color = Palette.action,
                contentColor = Palette.actionText,
            ) {
                Row(
                    Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                ) {
                    AppIcon(R.drawable.ic_plus, tint = Palette.actionText)
                    if (LocalDensity.current.fontScale < 1.5f) {
                        Text(
                            stringResource(R.string.meetings_create),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }
    }
}

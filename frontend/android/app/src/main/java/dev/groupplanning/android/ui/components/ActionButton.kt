package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ActionButton(
    title: String,
    modifier: Modifier = Modifier,
    primary: Boolean = true,
    enabled: Boolean = true,
    icon: Int? = null,
    busy: Boolean = false,
    onClick: () -> Unit,
) {
    val busyLabel = stringResource(R.string.auth_busy)
    Surface(
        onClick = onClick,
        enabled = enabled && !busy,
        modifier = modifier.semantics {
            stateDescription = if (busy) busyLabel else ""
        }.fillMaxWidth().defaultMinSize(minHeight = 52.dp),
        shape = RoundedCornerShape(15.dp),
        color = if (primary) Palette.action else Palette.message,
        contentColor = if (primary) Palette.actionText else Palette.text,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Row(
                Modifier.alpha(if (busy) 0f else 1f).padding(horizontal = 18.dp, vertical = 15.dp),
                horizontalArrangement = Arrangement.spacedBy(
                    12.dp,
                    if (icon != null && !primary) {
                        Alignment.Start
                    } else {
                        Alignment.CenterHorizontally
                    },
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                icon?.let { AppIcon(it, tint = if (primary) Palette.actionText else Palette.text) }
                Text(title, fontWeight = FontWeight.SemiBold)
            }
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(22.dp),
                    color = if (primary) Palette.actionText else Palette.text,
                    strokeWidth = 2.dp,
                )
            }
        }
    }
}

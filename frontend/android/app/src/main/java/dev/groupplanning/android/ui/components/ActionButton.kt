package dev.groupplanning.android.ui.components

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ActionButton(
    title: String,
    modifier: Modifier = Modifier,
    primary: Boolean = true,
    enabled: Boolean = true,
    icon: Int? = null,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().defaultMinSize(minHeight = 52.dp),
        shape = RoundedCornerShape(15.dp),
        color = if (primary) Palette.action else Palette.message,
        contentColor = if (primary) Palette.actionText else Palette.text,
    ) {
        Row(
            Modifier.padding(horizontal = 18.dp, vertical = 15.dp),
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
    }
}

package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.TextUnit
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun RequiredFieldLabel(
    label: String,
    required: Boolean = false,
    fontSize: TextUnit = DesignTokens.typographySizeSmall,
    color: Color = Color.Unspecified,
    lineHeight: TextUnit = TextUnit.Unspecified,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            Modifier.alignByBaseline(),
            fontSize = fontSize,
            lineHeight = lineHeight,
            color = color,
        )
        if (required) RequiredMark(Modifier.alignByBaseline())
    }
}

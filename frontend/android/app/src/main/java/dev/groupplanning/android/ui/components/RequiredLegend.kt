package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun RequiredLegend(sentence: Boolean = false) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RequiredMark(Modifier.alignByBaseline())
        Text(
            stringResource(
                if (sentence) R.string.create_required_legend else R.string.required_fields,
            ),
            Modifier.alignByBaseline(),
            fontSize = DesignTokens.typographySizeCaption,
            color = DesignTokens.colorMuted,
        )
    }
}

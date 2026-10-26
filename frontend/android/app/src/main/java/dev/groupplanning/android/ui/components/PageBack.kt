package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun PageBack(enabled: Boolean = true, close: () -> Unit) {
    Surface(close, enabled = enabled, color = Color.Transparent) {
        Row(
            Modifier.heightIn(min = 44.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            AppIcon(R.drawable.ic_back, Modifier.size(22.dp), Palette.accent)
            Text(
                stringResource(R.string.experience_back),
                color = Palette.accent,
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
            )
        }
    }
}

package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun GalleryCounter(
    index: Int,
    count: Int,
    grid: Boolean,
    toggle: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            Modifier.widthIn(min = DesignTokens.componentMobileVibeCounterMinimumWidth),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (count == 0) "0" else "${index + 1}",
                fontSize = DesignTokens.componentMobileVibeCounterSize.value.sp,
                lineHeight = DesignTokens.componentMobileVibeCounterLineHeight.value.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text("/ $count", fontSize = DesignTokens.typographySizeCaption, color = Palette.muted)
        }
        val label = stringResource(if (grid) R.string.memories_stack else R.string.memories_grid)
        IconButton(
            toggle,
            Modifier.size(DesignTokens.targetAndroid).semantics {
                contentDescription =
                    label
            },
        ) {
            if (grid) {
                ChatIcon(
                    ChatSymbol.Layers,
                    Modifier.size(DesignTokens.componentMobileVibeViewIconSize),
                )
            } else {
                AppIcon(
                    R.drawable.ic_grid,
                    Modifier.size(DesignTokens.componentMobileVibeViewIconSize),
                )
            }
        }
    }
}

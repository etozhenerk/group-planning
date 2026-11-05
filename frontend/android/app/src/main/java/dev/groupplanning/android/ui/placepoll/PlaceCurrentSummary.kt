package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PlaceCurrentSummary(place: String?) {
    Surface(
        color = DesignTokens.colorBackground,
        shape = RoundedCornerShape(DesignTokens.spaceS12 + DesignTokens.spaceS2),
        border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(DesignTokens.spaceS12 + DesignTokens.spaceS2),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            ChatIcon(
                ChatSymbol.Pin,
                Modifier.size(DesignTokens.componentMobileFieldIconSize),
                tint = DesignTokens.colorAccent,
            )
            Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4)) {
                Text(
                    stringResource(R.string.place_current_caption),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
                Text(
                    place ?: stringResource(R.string.place_not_selected),
                    fontSize = DesignTokens.typographySizeSmall,
                )
            }
        }
    }
}

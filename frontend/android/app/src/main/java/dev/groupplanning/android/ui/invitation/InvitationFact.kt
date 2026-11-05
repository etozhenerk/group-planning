package dev.groupplanning.android.ui.invitation

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationFact(@DrawableRes icon: Int, text: String, detail: String? = null) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        verticalAlignment = Alignment.Top,
    ) {
        Icon(
            painterResource(icon),
            null,
            Modifier.size(DesignTokens.componentMobileRosterActionIcon),
            tint = DesignTokens.colorMuted,
        )
        Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4)) {
            Text(text, fontSize = DesignTokens.typographySizeButton, fontWeight = FontWeight.Medium)
            detail?.let {
                Text(
                    it,
                    fontSize = DesignTokens.typographySizeSmall,
                    color = DesignTokens.colorMuted,
                )
            }
        }
    }
}

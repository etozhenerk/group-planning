package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreationFieldHint(text: String) {
    Row(
        Modifier.semantics { liveRegion = LiveRegionMode.Assertive },
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFieldGap),
    ) {
        ChatIcon(
            ChatSymbol.Alert,
            Modifier.size(DesignTokens.componentMobileCreationHintIconSize),
            tint = DesignTokens.colorError,
        )
        Text(
            text,
            fontSize = DesignTokens.typographySizeCaption,
            lineHeight = DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
            color = DesignTokens.colorMuted,
        )
    }
}

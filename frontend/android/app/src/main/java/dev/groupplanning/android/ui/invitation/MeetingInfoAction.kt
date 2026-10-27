package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInfoAction(
    title: String,
    action: () -> Unit,
    modifier: Modifier = Modifier,
    icon: @Composable () -> Unit,
) {
    Row(
        modifier.fillMaxWidth().heightIn(min = DesignTokens.componentMobileRosterActionHeight)
            .clickable(role = Role.Button, onClick = action),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        icon()
        Text(title, Modifier.weight(1f), fontSize = DesignTokens.typographySizeButton)
        ChatIcon(ChatSymbol.Right, Modifier.size(DesignTokens.spaceS16))
    }
}

package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.Composable
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun FeedAvatar(name: String, avatarUrl: String? = null) {
    val colors = listOf(
        DesignTokens.colorRosterMint,
        DesignTokens.colorRosterSand,
        DesignTokens.colorRosterBlue,
        DesignTokens.colorRosterLilac,
    )
    UserAvatar(
        name,
        avatarUrl,
        size = DesignTokens.componentMobileChatMessageAvatar,
        avatarColor = colors[(name.firstOrNull()?.code ?: 0) % colors.size],
        textSize = DesignTokens.typographySizeCaption,
        textColor = DesignTokens.colorRosterText,
    )
}

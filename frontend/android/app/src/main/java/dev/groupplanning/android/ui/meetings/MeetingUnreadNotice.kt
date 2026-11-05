package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingUnreadNotice(count: ServerCounter, modifier: Modifier = Modifier) {
    val capped = count.value.length > 2
    val display = if (capped) "99+" else count.value
    val quantity = if (capped) 0 else count.value.toInt()
    val label = pluralStringResource(R.plurals.meeting_unread_notice, quantity, display)
    val accessible = pluralStringResource(
        R.plurals.chat_unread_count,
        count.value.takeLast(2).toInt(),
        count.value,
    )
    Row(
        modifier.testTag("meeting-unread").clearAndSetSemantics { contentDescription = accessible },
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileUnreadGap),
    ) {
        ChatIcon(
            ChatSymbol.Message,
            Modifier.size(DesignTokens.componentMobileUnreadIconSize),
            tint = DesignTokens.colorAccent,
            strokeWidth = DesignTokens.componentMobileUnreadIconStrokeWidth,
        )
        Text(
            label,
            color = DesignTokens.colorAccent,
            fontSize = DesignTokens.typographySizeLabel,
            fontWeight = FontWeight.Medium,
            lineHeight = DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
        )
    }
}

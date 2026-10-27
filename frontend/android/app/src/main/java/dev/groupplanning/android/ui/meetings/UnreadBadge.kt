package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun UnreadBadge(count: ServerCounter?) {
    if (count == null || count == ServerCounter.Zero) return
    val label =
        pluralStringResource(
            R.plurals.chat_unread_count,
            count.value.takeLast(2).toInt(),
            count.value,
        )
    Box(
        Modifier.sizeIn(minWidth = DesignTokens.spaceS24, minHeight = DesignTokens.spaceS24)
            .background(DesignTokens.colorAccent, RoundedCornerShape(DesignTokens.radiusPill))
            .padding(horizontal = DesignTokens.spaceS8).testTag("meeting-unread")
            .clearAndSetSemantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            count.value,
            color = DesignTokens.colorOwnText,
            fontSize = DesignTokens.typographySizeCaption,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

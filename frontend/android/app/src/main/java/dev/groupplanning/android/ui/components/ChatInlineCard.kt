package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatInlineCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier.padding(start = DesignTokens.componentMobileChatInlineIndent)
            .widthIn(max = DesignTokens.componentMobileChatInlineMaximumWidth).fillMaxWidth(),
        shape = RoundedCornerShape(DesignTokens.componentMobileChatInlineRadius),
        color = DesignTokens.colorSurface,
        contentColor = DesignTokens.colorText,
        border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
    ) {
        Column(
            Modifier.padding(DesignTokens.componentMobileChatInlineInset),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            content = content,
        )
    }
}

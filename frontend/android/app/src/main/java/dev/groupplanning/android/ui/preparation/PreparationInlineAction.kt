package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PreparationInlineAction(
    label: String,
    enabled: Boolean,
    busy: Boolean,
    modifier: Modifier = Modifier,
    act: () -> Unit,
) {
    Surface(
        act,
        modifier.heightIn(min = DesignTokens.targetAndroid),
        enabled = enabled && !busy,
        shape = RoundedCornerShape(DesignTokens.componentMobileChatInlineActionRadius),
        color = DesignTokens.colorAction,
        contentColor = DesignTokens.colorActionText,
    ) {
        Box(
            Modifier.padding(
                horizontal = DesignTokens.componentMobileChatInlineActionInsetInline,
                vertical = DesignTokens.componentMobileChatInlineActionInsetBlock,
            ),
            contentAlignment = Alignment.Center,
        ) {
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(DesignTokens.componentButtonIconSize),
                    color = DesignTokens.colorActionText,
                    strokeWidth = DesignTokens.spaceS2,
                )
            } else {
                Text(
                    label,
                    fontSize = DesignTokens.typographySizeSmall,
                    lineHeight =
                    DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                    fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
                )
            }
        }
    }
}

package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InformationAction(
    title: String,
    action: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
) {
    Surface(
        onClick = action,
        enabled = enabled,
        modifier = modifier.defaultMinSize(
            minHeight = maxOf(
                DesignTokens.targetAndroid,
                DesignTokens.componentButtonMinimumHeight,
            ),
        ),
        shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
        color = if (primary) DesignTokens.colorAction else Color.Transparent,
        contentColor = if (primary) DesignTokens.colorActionText else DesignTokens.colorText,
        border = if (primary) {
            null
        } else {
            BorderStroke(
                DesignTokens.spaceS1,
                DesignTokens.colorSubtleBorder,
            )
        },
    ) {
        Text(
            title,
            Modifier.padding(
                horizontal = DesignTokens.componentButtonPaddingInline,
                vertical = DesignTokens.componentButtonPaddingBlock,
            ),
            fontSize = DesignTokens.typographySizeButton,
            lineHeight = DesignTokens.typographySizeButton * DesignTokens.typographyLineHeightBody,
            fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
            textAlign = TextAlign.Center,
        )
    }
}

package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
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
    selected: Boolean = false,
    small: Boolean = false,
) {
    val textSize = if (small) {
        DesignTokens.typographySizeSmall
    } else {
        DesignTokens.typographySizeButton
    }
    Surface(
        onClick = action,
        enabled = enabled,
        modifier = modifier.alpha(if (enabled) 1f else DesignTokens.componentButtonDisabledOpacity)
            .defaultMinSize(
                minHeight = maxOf(
                    DesignTokens.targetAndroid,
                    DesignTokens.componentButtonMinimumHeight,
                ),
            ),
        shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
        color = when {
            selected -> DesignTokens.colorNavigationSelected
            primary -> DesignTokens.colorAction
            else -> Color.Transparent
        },
        contentColor = when {
            selected -> DesignTokens.colorNavigationSelectedText
            primary -> DesignTokens.colorActionText
            else -> DesignTokens.colorText
        },
        border = if (primary && !selected) {
            null
        } else {
            BorderStroke(
                DesignTokens.spaceS1,
                if (selected) {
                    DesignTokens.colorAccent
                } else if (small) {
                    DesignTokens.colorBorderStrong
                } else {
                    DesignTokens.colorSubtleBorder
                },
            )
        },
    ) {
        Text(
            title,
            Modifier.padding(
                horizontal = DesignTokens.componentButtonPaddingInline,
                vertical = DesignTokens.componentButtonPaddingBlock,
            ),
            fontSize = textSize,
            lineHeight = textSize * DesignTokens.typographyLineHeightBody,
            fontWeight = FontWeight(
                if (small) {
                    DesignTokens.typographyWeightMedium.toInt()
                } else {
                    DesignTokens.typographyWeightSemibold.toInt()
                },
            ),
            textAlign = TextAlign.Center,
        )
    }
}

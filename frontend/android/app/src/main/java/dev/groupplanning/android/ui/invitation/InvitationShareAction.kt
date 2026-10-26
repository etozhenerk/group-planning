package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationShareAction(
    title: String,
    share: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = share,
        modifier = modifier.fillMaxWidth().defaultMinSize(
            minHeight = maxOf(
                DesignTokens.componentButtonMinimumHeight,
                DesignTokens.targetAndroid,
            ),
        ),
        shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
        color = Color.Transparent,
        contentColor = DesignTokens.colorText,
        border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorSubtleBorder),
    ) {
        Row(
            Modifier.padding(
                horizontal = DesignTokens.componentButtonPaddingInline,
                vertical = DesignTokens.componentButtonPaddingBlock,
            ),
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.componentButtonIconGap,
                Alignment.CenterHorizontally,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AppIcon(
                R.drawable.ic_share,
                Modifier.size(DesignTokens.componentButtonIconSize),
                tint = DesignTokens.colorText,
            )
            Text(
                title,
                fontSize = DesignTokens.typographySizeButton,
                lineHeight =
                DesignTokens.typographySizeButton * DesignTokens.typographyLineHeightBody,
                fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
            )
        }
    }
}

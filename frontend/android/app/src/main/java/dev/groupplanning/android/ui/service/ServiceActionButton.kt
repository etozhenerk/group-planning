package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ServiceActionButton(
    title: String,
    modifier: Modifier = Modifier,
    busy: Boolean = false,
    enabled: Boolean = true,
    arrow: Boolean = false,
    click: () -> Unit,
) {
    Surface(
        click,
        modifier.fillMaxWidth(),
        enabled = enabled && !busy,
        color = DesignTokens.colorAction,
        contentColor = DesignTokens.colorActionText,
        shape = RoundedCornerShape(DesignTokens.componentMobileServiceActionRadius),
    ) {
        Row(
            Modifier.heightIn(min = DesignTokens.componentMobileServiceActionHeight)
                .padding(
                    horizontal = (DesignTokens.spaceS12 + DesignTokens.spaceS2),
                    vertical = DesignTokens.spaceS12,
                ),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.spaceS10,
                Alignment.CenterHorizontally,
            ),
        ) {
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(DesignTokens.spaceS16),
                    color = DesignTokens.colorActionText,
                    strokeWidth = DesignTokens.spaceS2,
                )
            }
            Text(
                title,
                fontSize = DesignTokens.typographySizeBody,
                lineHeight = DesignTokens.componentMobileServiceBodyLineHeight.value.sp,
                fontWeight = FontWeight.SemiBold,
            )
            if (arrow) {
                ServiceIcon(
                    ChatSymbol.UpRight,
                    DesignTokens.spaceS16 + DesignTokens.spaceS2,
                    DesignTokens.colorActionText,
                )
            }
        }
    }
}

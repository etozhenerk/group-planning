package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DecisionActionButton(
    title: String,
    enabled: Boolean,
    busy: Boolean,
    modifier: Modifier = Modifier,
    click: () -> Unit,
) {
    Surface(
        click,
        enabled = enabled && !busy,
        modifier = modifier.fillMaxWidth().defaultMinSize(minHeight = DesignTokens.targetAndroid)
            .alpha(
                if (enabled ||
                    busy
                ) {
                    1f
                } else {
                    DesignTokens.componentButtonDisabledOpacity.toFloat()
                },
            ),
        color = DesignTokens.colorAction,
        contentColor = DesignTokens.colorActionText,
        shape = RoundedCornerShape(DesignTokens.radiusControl),
    ) {
        Box(Modifier.padding(DesignTokens.spaceS10), contentAlignment = Alignment.Center) {
            if (busy) {
                CircularProgressIndicator(Modifier.size(DesignTokens.componentMobileFieldIconSize))
            } else {
                Text(
                    title,
                    fontSize = DesignTokens.typographySizeSmall,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

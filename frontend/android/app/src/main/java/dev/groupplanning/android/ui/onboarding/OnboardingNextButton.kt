package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingNextButton(
    final: Boolean,
    enabled: Boolean,
    expanded: Boolean = false,
    busy: Boolean = false,
    onClick: () -> Unit,
) {
    val title = stringResource(if (final) R.string.onboarding_login else R.string.onboarding_next)
    val waiting = stringResource(R.string.auth_busy)
    val foreground = if (final) DesignTokens.colorActionText else DesignTokens.colorText
    Surface(
        onClick,
        enabled = enabled && !busy,
        shape = RoundedCornerShape(DesignTokens.componentMobileOnboardingNextHeight / 2),
        color = if (final) DesignTokens.colorAction else DesignTokens.colorMobileOnboardingNext,
        contentColor = foreground,
        modifier = (if (expanded || final) Modifier.fillMaxWidth() else Modifier)
            .widthIn(min = DesignTokens.componentMobileOnboardingNextMinimumWidth)
            .heightIn(min = DesignTokens.componentMobileOnboardingNextHeight)
            .semantics {
                contentDescription = title
                stateDescription = if (busy) waiting else ""
            },
    ) {
        Box(Modifier.clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
            Row(
                Modifier.alpha(
                    if (busy) 0f else 1f,
                ).padding(
                    horizontal = DesignTokens.componentMobileOnboardingNextInsetInline,
                    vertical = DesignTokens.spaceS12,
                ),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileOnboardingCopyGap,
                    Alignment.CenterHorizontally,
                ),
            ) {
                Text(
                    title,
                    fontSize = DesignTokens.typographySizeBody,
                    fontWeight = FontWeight.SemiBold,
                )
                AppIcon(R.drawable.ic_arrow, tint = foreground)
            }
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(DesignTokens.spaceS20),
                    color = foreground,
                    strokeWidth = DesignTokens.spaceS2,
                )
            }
        }
    }
}

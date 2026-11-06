package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingQuietButton(
    title: String,
    visible: Boolean,
    enabled: Boolean,
    back: Boolean = false,
    onClick: () -> Unit,
) {
    val previous = stringResource(R.string.onboarding_previous)
    TextButton(
        onClick,
        enabled = visible && enabled,
        modifier = Modifier.defaultMinSize(
            minWidth = DesignTokens.targetAndroid,
            minHeight = DesignTokens.targetAndroid,
        )
            .alpha(if (visible) 1f else 0f)
            .then(
                if (visible) {
                    Modifier.semantics {
                        if (back) contentDescription = previous
                    }
                } else {
                    Modifier.clearAndSetSemantics {}
                },
            ),
    ) {
        if (back) {
            ChatIcon(ChatSymbol.Left, tint = DesignTokens.colorMuted)
        } else {
            Text(
                title,
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
            )
        }
    }
}

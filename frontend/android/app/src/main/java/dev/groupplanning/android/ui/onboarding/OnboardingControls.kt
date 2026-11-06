package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingControls(
    page: Int,
    enabled: Boolean,
    choose: (Int) -> Unit,
    busy: Boolean = false,
    moving: Boolean = false,
    next: () -> Unit,
) {
    val expanded = LocalDensity.current.fontScale > 1.3f
    Column(
        Modifier.fillMaxWidth().padding(
            horizontal = DesignTokens.componentMobileOnboardingInsetInline,
        ).padding(bottom = DesignTokens.spaceS16),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
    ) {
        OnboardingProgress(page, enabled, choose)
        if (expanded || page == OnboardingSlide.entries.lastIndex) {
            OnboardingNextButton(
                page == OnboardingSlide.entries.lastIndex,
                enabled && (page != OnboardingSlide.entries.lastIndex || !moving),
                expanded = true,
                busy = busy,
                onClick = next,
            )
            OnboardingQuietButton("", page > 0, enabled, back = true) { choose(page - 1) }
        } else {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OnboardingQuietButton("", page > 0, enabled, back = true) { choose(page - 1) }
                OnboardingNextButton(
                    page == OnboardingSlide.entries.lastIndex,
                    enabled,
                    busy = busy,
                    onClick = next,
                )
            }
        }
    }
}

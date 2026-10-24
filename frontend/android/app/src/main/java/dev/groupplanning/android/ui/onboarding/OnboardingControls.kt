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
import androidx.compose.ui.unit.dp

@Composable
internal fun OnboardingControls(
    page: Int,
    enabled: Boolean,
    choose: (Int) -> Unit,
    busy: Boolean = false,
    next: () -> Unit,
) {
    val expanded = LocalDensity.current.fontScale > 1.3f
    Column(
        Modifier.fillMaxWidth().padding(horizontal = 26.dp).padding(bottom = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        OnboardingProgress(page, enabled, choose)
        if (expanded) {
            OnboardingNextButton(page == 4, enabled, expanded = true, busy = busy, onClick = next)
            OnboardingQuietButton("Назад", page > 0, enabled, back = true) { choose(page - 1) }
        } else {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OnboardingQuietButton("Назад", page > 0, enabled, back = true) { choose(page - 1) }
                OnboardingNextButton(page == 4, enabled, busy = busy, onClick = next)
            }
        }
    }
}

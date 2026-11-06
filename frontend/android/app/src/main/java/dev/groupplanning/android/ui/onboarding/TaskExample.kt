package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.preparation.PreparationTaskCard
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun TaskExample() {
    val title = stringResource(R.string.onboarding_task_title)
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20)) {
        listOf(false, true).forEach { accepted ->
            Column(
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileOnboardingStoryLabelGap,
                ),
            ) {
                val story = if (accepted) {
                    R.string.onboarding_task_accepted
                } else {
                    R.string.onboarding_task_offered
                }
                val tracking = DesignTokens.componentMobileOnboardingStoryLabelTracking
                Text(
                    stringResource(story).uppercase(),
                    fontSize = DesignTokens.componentMobileOnboardingStoryLabelSize.value.sp,
                    letterSpacing = tracking.value.sp,
                    color = DesignTokens.colorMuted,
                )
                PreparationTaskCard(
                    PreparationTaskState(
                        task = OnboardingExamples.task(title, accepted),
                    ),
                    OnboardingExamples.entry,
                    OnboardingExamples.friend.id,
                    {
                    },
                    {},
                )
            }
        }
    }
}

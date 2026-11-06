package dev.groupplanning.android.ui.onboarding

import androidx.compose.runtime.Composable
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.datepoll.DatePollActions
import dev.groupplanning.android.ui.datepoll.DatePollCard

@Composable
internal fun DateExample() {
    DatePollCard(
        DatePollState(
            poll = OnboardingExamples.date,
            selected = OnboardingExamples.date.myOptionIds.toSet(),
        ),
        OnboardingExamples.meeting,
        OnboardingExamples.entry,
        DatePollActions({}, {}, {}, { _, _ -> }, {}),
    )
}

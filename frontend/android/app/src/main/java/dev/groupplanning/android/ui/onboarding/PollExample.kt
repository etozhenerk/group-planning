package dev.groupplanning.android.ui.onboarding

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.placepoll.PlacePollCard

@Composable
internal fun PollExample() {
    val poll = OnboardingExamples.place(
        stringResource(R.string.onboarding_place_title),
        stringResource(R.string.onboarding_place_explanation),
    )
    PlacePollCard(
        PlacePollState(
            poll = poll,
        ),
        OnboardingExamples.meeting,
        OnboardingExamples.entry,
        {
        },
        {},
    )
}

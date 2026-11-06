package dev.groupplanning.android.ui.onboarding

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.meetings.MeetingCard

@Composable
internal fun OnboardingMeetingPreview(
    coffee: Boolean = false,
    first: Boolean = false,
    photo: Boolean = false,
) {
    val title = stringResource(
        if (first) {
            R.string.onboarding_first_meeting
        } else if (coffee) {
            R.string.onboarding_coffee
        } else {
            R.string.onboarding_boardgame
        },
    )
    val place =
        stringResource(
            if (coffee) R.string.onboarding_coffee_place else R.string.onboarding_boardgame_place,
        )
    MeetingCard(
        OnboardingExamples.summary(title, place, coffee, first),
        coverPreview = if (photo) {
            { OnboardingPhoto(R.drawable.onboarding_boardgame) }
        } else {
            null
        },
    ) {}
}

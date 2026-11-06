package dev.groupplanning.android.ui.onboarding

import androidx.annotation.StringRes
import dev.groupplanning.android.R

internal enum class OnboardingSlide(
    @get:StringRes val title: Int,
    @get:StringRes val text: Int,
    @get:StringRes val example: Int,
) {
    Invitation(
        R.string.onboarding_title_0,
        R.string.onboarding_text_0,
        R.string.onboarding_example_0,
    ),
    Meetings(
        R.string.onboarding_title_1,
        R.string.onboarding_text_1,
        R.string.onboarding_example_1,
    ),
    Conversation(
        R.string.onboarding_title_2,
        R.string.onboarding_text_2,
        R.string.onboarding_example_2,
    ),
    Date(R.string.onboarding_title_3, R.string.onboarding_text_3, R.string.onboarding_example_3),
    Poll(R.string.onboarding_title_4, R.string.onboarding_text_4, R.string.onboarding_example_4),
    Task(R.string.onboarding_title_5, R.string.onboarding_text_5, R.string.onboarding_example_5),
    Album(R.string.onboarding_title_6, R.string.onboarding_text_6, R.string.onboarding_example_6),
    Plans(R.string.onboarding_title_7, R.string.onboarding_text_7, R.string.onboarding_example_7),
}

package dev.groupplanning.android.ui.invitation

import androidx.annotation.StringRes
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer

@StringRes
internal fun RsvpAnswer.label(): Int = when (this) {
    RsvpAnswer.Going -> R.string.rsvp_going
    RsvpAnswer.Maybe -> R.string.rsvp_maybe
    RsvpAnswer.NotGoing -> R.string.rsvp_not_going
}

@StringRes
internal fun RsvpAnswer.confirmation(): Int = when (this) {
    RsvpAnswer.Going -> R.string.rsvp_confirmed_going
    RsvpAnswer.Maybe -> R.string.rsvp_confirmed_maybe
    RsvpAnswer.NotGoing -> R.string.rsvp_confirmed_not_going
}

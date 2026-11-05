package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R

@Composable
internal fun SavedInvitationsLoading() {
    dev.groupplanning.android.ui.components.ExperienceSkeleton(
        label = stringResource(R.string.saved_invitations_loading),
    )
}

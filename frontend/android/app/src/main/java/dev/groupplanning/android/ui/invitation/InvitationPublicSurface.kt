package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.DetailsSkeleton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationPublicSurface(
    state: InvitationState,
    profile: UserProfile?,
    close: () -> Unit,
    respond: (RsvpAnswer) -> Unit,
    reload: () -> Unit,
    authenticating: Boolean,
    signIn: () -> Unit,
) {
    val preview = state.details?.preview?.let {
        it.copy(coverUrl = it.coverUrl?.takeUnless { url -> url.contains("/meetings/") })
    }
    val responseIssue = state.issue in setOf(
        InvitationIssue.Unconfirmed,
        InvitationIssue.Conflict,
        InvitationIssue.Rejected,
    )
    Column(Modifier.fillMaxSize().testTag("invitation-screen")) {
        InvitationPageHeader(profile, close)
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = DesignTokens.spaceS20)
                .padding(bottom = DesignTokens.spaceS24),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS24),
        ) {
            preview?.let { InvitationFacts(it, closed = state.joinClosed) }
            if (preview == null && !state.loading) {
                InvitationUnavailable(reload)
            } else if (!responseIssue && state.issue != InvitationIssue.JoinClosed) {
                state.issue?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
            }
            if (state.loading &&
                preview == null
            ) {
                DetailsSkeleton(
                    stringResource(R.string.invitation_loading),
                    "invitation-loading",
                )
            }
        }
        if (preview != null && (!state.joinClosed || state.pending != null)) {
            InvitationResponsePanel {
                if (responseIssue) {
                    state.issue?.let { InvitationResponseNotice(it) }
                }
                RsvpForm(state, profile != null, respond, authenticating, signIn)
            }
        }
    }
}

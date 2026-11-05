package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.SavedInvitationsData
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.MobileStatus
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun SavedInvitationsScreen(
    data: SavedInvitationsData,
    backToMeetings: () -> Unit,
    refresh: () -> Unit,
    more: () -> Unit,
    select: (String) -> Unit,
) {
    val largeText = LocalDensity.current.fontScale >= 1.5f
    Column(Modifier.fillMaxSize()) {
        SavedInvitationsHeader(data.page?.invitations?.size, data.page?.nextCursor != null)
        if (!largeText) {
            Box(
                Modifier.padding(horizontal = DesignTokens.spaceS20)
                    .padding(bottom = DesignTokens.spaceS20),
            ) { SavedInvitationsExplanation() }
        }
        LazyColumn(
            Modifier.weight(1f).fillMaxWidth().testTag("saved-invitations-list"),
            contentPadding = PaddingValues(
                start = DesignTokens.spaceS20,
                end = DesignTokens.spaceS20,
                top = DesignTokens.spaceS4,
                bottom = DesignTokens.componentMobileInvitationsScrollBottom,
            ),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            if (largeText) {
                item {
                    SavedInvitationsExplanation(Modifier.padding(bottom = DesignTokens.spaceS20))
                }
            }
            if (data.page == null && data.error == null) {
                item { SavedInvitationsLoading() }
            }
            if (data.error != null) {
                item {
                    MobileStatus(
                        stringResource(
                            if (data.page == null) {
                                R.string.saved_invitations_error
                            } else {
                                R.string.saved_invitations_refresh_error
                            },
                        ),
                        data.page != null,
                        refresh,
                        large = false,
                    )
                }
            }
            if (data.page?.invitations?.isEmpty() == true && data.error == null) {
                item {
                    MobileStatus(
                        stringResource(R.string.saved_invitations_empty),
                        false,
                        backToMeetings,
                        large = false,
                        symbol = ChatSymbol.Mail,
                        actionLabel = stringResource(R.string.saved_invitations_back),
                        actionSymbol = null,
                    )
                }
            }
            items(data.page?.invitations.orEmpty(), key = { it.preview.meetingId }) { item ->
                SavedInvitationCard(item) { select(item.invitationUrl) }
            }
            if (data.page?.nextCursor != null) {
                item {
                    ActionButton(
                        stringResource(R.string.calendar_more),
                        primary = false,
                        busy = data.request != null,
                        onClick = more,
                    )
                }
            }
        }
    }
}

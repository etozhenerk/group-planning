package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.SavedInvitationsData
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.meetings.MeetingListHeading
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SavedInvitationsScreen(
    data: SavedInvitationsData,
    tabs: @Composable () -> Unit,
    create: () -> Unit,
    refresh: () -> Unit,
    more: () -> Unit,
    select: (String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        MeetingListHeading(true, false, create)
        tabs()
        LazyColumn(
            Modifier.weight(1f).fillMaxWidth().testTag("saved-invitations-list"),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (data.page == null && data.error == null) {
                item { SavedInvitationsLoading() }
            }
            if (data.error != null) {
                item {
                    StatusPanel(
                        stringResource(R.string.saved_invitations_error),
                        stringResource(R.string.calendar_retry_message),
                        refresh,
                    )
                }
            }
            if (data.page?.invitations?.isEmpty() == true && data.error == null) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            stringResource(R.string.saved_invitations_empty),
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            stringResource(R.string.saved_invitations_empty_hint),
                            color = Palette.muted,
                        )
                    }
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
                        busy =
                        data.request != null,
                        onClick = more,
                    )
                }
            }
        }
    }
}

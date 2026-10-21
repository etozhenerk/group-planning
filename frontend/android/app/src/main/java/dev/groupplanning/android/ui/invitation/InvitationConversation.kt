package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun InvitationConversation(
    state: InvitationState,
    snapshot: ClientSnapshot,
    choose: (RsvpAnswer) -> Unit,
    save: () -> Unit,
    reload: () -> Unit,
    back: () -> Unit,
) {
    val details = state.details ?: return
    val id = details.preview.meetingId
    var information by remember(id) { mutableStateOf(false) }
    val backLabel = stringResource(R.string.my_meetings)
    val infoLabel = stringResource(R.string.meeting_information)
    Column(Modifier.fillMaxSize().testTag("invitation-conversation")) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(
                back,
                Modifier.semantics {
                    contentDescription = backLabel
                },
            ) { AppIcon(R.drawable.ic_back) }
            Text(details.preview.title, Modifier.weight(1f), fontWeight = FontWeight.Bold)
            if (details.organizer) state.shareUrl?.let { InvitationShare(it) }
            IconButton({
                information = true
            }, Modifier.semantics { contentDescription = infoLabel }) {
                AppIcon(R.drawable.ic_info)
            }
        }
        HorizontalDivider(color = Palette.border)
        InvitationMessages(snapshot.data.feeds[id], snapshot, reload, Modifier.weight(1f))
    }
    if (information) {
        ModalBottomSheet(
            onDismissRequest = { information = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = Palette.background,
        ) {
            Column(
                Modifier.verticalScroll(
                    rememberScrollState(),
                ).padding(horizontal = 24.dp).padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(26.dp),
            ) {
                InvitationFacts(details.preview, showTitle = false)
                if (!details.organizer) {
                    RsvpForm(state, true, choose, save)
                }
                state.issue?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
                val people = snapshot.data.participants[id]
                people?.value?.let {
                    InvitationParticipants(
                        it,
                        details.meeting?.participantCount ?: 0,
                    )
                }
                if (people?.error != null) {
                    InvitationProblem(
                        dev.groupplanning.android.state.InvitationIssue.Load,
                        true,
                        reload,
                    )
                }
            }
        }
    }
}

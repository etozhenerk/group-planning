package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.repository.preview
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.feed.FeedScreen
import dev.groupplanning.android.ui.settings.MeetingSettingsSheet
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun InvitationConversation(
    state: InvitationState,
    snapshot: ClientSnapshot,
    choose: (RsvpAnswer) -> Unit,
    save: () -> Unit,
    reload: () -> Unit,
    back: () -> Unit,
    feed: FeedViewModel?,
) {
    val original = state.details ?: return
    val current = snapshot.data.details[original.preview.meetingId]?.value
    val details = current?.let { original.copy(meeting = it, preview = it.preview()) } ?: original
    val id = details.preview.meetingId
    var information by remember(id) { mutableStateOf(false) }
    val settings = feed?.settings?.collectAsStateWithLifecycle()?.value
    val backLabel = stringResource(R.string.my_meetings)
    val infoLabel = stringResource(R.string.meeting_information)
    Column(Modifier.fillMaxSize().testTag("invitation-conversation")) {
        Row(
            Modifier.heightIn(min = 88.dp).padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            IconButton(
                back,
                Modifier.size(39.dp).semantics {
                    contentDescription = backLabel
                },
            ) { AppIcon(R.drawable.ic_back) }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    details.preview.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    lineHeight = 20.7.sp,
                    letterSpacing = (-.6).sp,
                )
                val time = details.preview.startsAt?.instant?.atZone(
                    ZoneId.of(details.preview.timezone),
                )
                    ?.format(
                        DateTimeFormatter.ofPattern("d MMMM · HH:mm", Locale.forLanguageTag("ru")),
                    )
                val people = stringResource(
                    R.string.experience_participants_count,
                    details.meeting?.participantCount ?: 0,
                )
                Text(
                    if (time == null) people else "$people · $time",
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = Palette.muted,
                )
            }
            if (details.organizer) state.shareUrl?.let { InvitationShare(it) }
            IconButton({
                information = true
            }, Modifier.size(39.dp).semantics { contentDescription = infoLabel }) {
                AppIcon(R.drawable.ic_more)
            }
        }
        HorizontalDivider(color = Color(0x12ffffff))
        val profile = (snapshot.session as? SessionState.Authenticated)?.profile
        if (feed != null && profile != null) {
            FeedScreen(
                feed,
                profile,
                Modifier.weight(1f),
                state.shareUrl.takeIf {
                    details.organizer
                },
            )
        }
    }
    if (information) {
        ActionSheet(
            title = details.preview.title,
            close = { information = false },
            modifier = Modifier.testTag("meeting-information"),
        ) {
            InvitationFacts(details.preview, showTitle = false)
            if (!details.organizer) {
                RsvpForm(state, true, choose, save)
            }
            state.issue?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
            val people = snapshot.data.participants[id]
            people?.value?.let {
                InvitationParticipants(it, details.meeting?.participantCount ?: 0)
            }
            if (people?.error != null) {
                InvitationProblem(InvitationIssue.Load, true, reload)
            }
            if (details.organizer) {
                state.shareUrl?.let { InvitationShare(it, showLabel = true) }
                ActionButton(
                    stringResource(R.string.meeting_settings),
                    Modifier.testTag("open-settings"),
                    primary = false,
                ) {
                    details.meeting?.let { feed?.openSettings(it) }
                    if (feed?.settings?.value != null) information = false
                }
            }
        }
    }
    settings?.let { model ->
        MeetingSettingsSheet(
            model,
            close = { feed?.closeSettings() },
            saved = {
                feed?.closeSettings()
                reload()
                feed?.refresh()
            },
        )
    }
}

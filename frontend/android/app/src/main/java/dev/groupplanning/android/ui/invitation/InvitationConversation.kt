package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.repository.preview
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.ui.feed.ChatPresentation
import dev.groupplanning.android.ui.feed.FeedScreen
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.feed.dismissComposerOnOutsideTap
import dev.groupplanning.android.ui.settings.MeetingSettingsSheet
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationConversation(
    state: InvitationState,
    snapshot: ClientSnapshot,
    respond: (RsvpAnswer) -> Unit,
    reload: () -> Unit,
    back: () -> Unit,
    feed: FeedViewModel?,
) {
    val original = state.details ?: return
    val current = snapshot.data.details[original.preview.meetingId]?.value
    val details = current?.let { original.copy(meeting = it, preview = it.preview()) } ?: original
    val id = details.preview.meetingId
    val presentation =
        rememberSaveable(id.toString(), saver = ChatPresentation.Saver) { ChatPresentation() }
    var information by rememberSaveable(id.toString()) { mutableStateOf(false) }
    var settingsSaved by rememberSaveable(id.toString()) { mutableStateOf(false) }
    var infoChild by rememberSaveable(id.toString()) { mutableStateOf<String?>(null) }
    val feedState = feed?.state?.collectAsStateWithLifecycle()?.value
    val share: () -> Unit = {
        settingsSaved = false
        information = true
        infoChild = "share"
    }
    LaunchedEffect(state.completedResponseID) {
        if (state.completedResponseID != null) {
            information = false
            infoChild = null
        }
    }
    val settings = feed?.settings?.collectAsStateWithLifecycle()?.value
    val informationFocus = remember { FocusRequester() }
    val headingFocus = remember { FocusRequester() }
    val shareFocus = remember { FocusRequester() }
    var opener by rememberSaveable(id.toString()) {
        mutableStateOf(MeetingChatOpener.Information)
    }
    var wasOpen by remember { mutableStateOf(false) }
    val open = information || settings != null
    LaunchedEffect(open) {
        if (!open && wasOpen) {
            withFrameNanos { }
            when (opener) {
                MeetingChatOpener.Heading -> headingFocus.requestFocus()
                MeetingChatOpener.Information -> informationFocus.requestFocus()
                MeetingChatOpener.Share -> shareFocus.requestFocus()
            }
        }
        wasOpen = open
    }
    CompositionLocalProvider(LocalChatPresentation provides presentation) {
        Column(
            Modifier.fillMaxSize().dismissComposerOnOutsideTap(presentation)
                .testTag("invitation-conversation"),
        ) {
            MeetingChatHeader(
                details.preview,
                details.meeting?.participantCount ?: 0,
                back,
                { selected ->
                    presentation.dismiss()
                    opener = selected
                    information = true
                },
                if (details.organizer &&
                    state.shareUrl != null &&
                    feedState?.entries?.any { it.kind == "message" } == true
                ) {
                    {
                        presentation.dismiss()
                        opener = MeetingChatOpener.Share
                        share()
                    }
                } else {
                    null
                },
                informationFocus,
                headingFocus,
                shareFocus,
            )
            HorizontalDivider(color = DesignTokens.colorLine)
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
        if (information || settings != null) {
            MeetingSettingsSheet(
                model = settings,
                close = {
                    if (settings !=
                        null
                    ) {
                        feed?.closeSettings()
                    } else {
                        if (infoChild != null) infoChild = null else information = false
                    }
                },
                saved = {
                    settingsSaved = true
                    feed?.closeSettings()
                    reload()
                    feed?.refresh()
                },
                parentTitle = stringResource(
                    when (infoChild) {
                        "response" -> R.string.info_response_title
                        "share" -> R.string.invitation_share
                        else -> R.string.info_title
                    },
                ),
                parentHasChild = infoChild != null,
                parentActions = if (infoChild == null) {
                    {
                        MeetingInformationFooter(state.copy(details = details), share) {
                            infoChild =
                                "response"
                        }
                    }
                } else {
                    null
                },
            ) {
                if (infoChild != null) {
                    androidx.compose.material3.TextButton({
                        infoChild = null
                    }) { androidx.compose.material3.Text(stringResource(R.string.info_back)) }
                }
                when (infoChild) {
                    "response" -> MeetingInformationRsvp(
                        state.copy(details = details),
                        respond,
                        reload,
                    )
                    "share" -> {
                        if (state.shareUrl !=
                            null
                        ) {
                            MeetingShareContent(details.preview, state.shareUrl)
                        } else if (state.issue ==
                            InvitationIssue.Share
                        ) {
                            InvitationProblem(InvitationIssue.Share, !state.loading, reload)
                        } else {
                            androidx.compose.material3.CircularProgressIndicator()
                        }
                    }
                    else -> {
                        val people = snapshot.data.participants[id]
                        if (settingsSaved) {
                            androidx.compose.material3.Text(
                                stringResource(R.string.settings_saved),
                                color = DesignTokens.colorAccent,
                            )
                        }
                        MeetingInformationContent(
                            state.copy(details = details),
                            people?.value,
                            people?.error != null,
                            reload,
                        ) {
                            settingsSaved = false
                            details.meeting?.let { feed?.openSettings(it) }
                        }
                    }
                }
            }
        }
    }
}

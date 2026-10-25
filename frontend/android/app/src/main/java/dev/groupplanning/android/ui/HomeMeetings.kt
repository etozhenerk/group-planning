package dev.groupplanning.android.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.meetings.MeetingListScreen
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.savedinvitations.SavedInvitationsScreen

@Composable
internal fun HomeMeetings(model: AppViewModel, snapshot: ClientSnapshot) {
    Column {
        val calendar = checkNotNull(model.calendar)
        val selection by calendar.selection.collectAsStateWithLifecycle()
        val invitations by model.homeInvitations.collectAsStateWithLifecycle()
        val savedInvitations = checkNotNull(model.savedInvitations)
        val lifecycle = LocalLifecycleOwner.current.lifecycle
        LaunchedEffect(calendar, lifecycle, invitations) {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                if (invitations) savedInvitations.observe() else calendar.observe()
            }
        }
        MeetingsHeader()
        if (invitations) {
            SavedInvitationsScreen(
                snapshot.data.invitations,
                tabs = {},
                create = model::create,
                refresh = { savedInvitations.refresh() },
                more = { savedInvitations.refresh(true) },
                select = model::receiveLink,
            )
        } else {
            MeetingListScreen(
                snapshot.data.calendar,
                selection,
                calendar::select,
                model::create,
                model::refresh,
                model::loadMore,
                model::open,
                tabs = {},
            )
        }
    }
}

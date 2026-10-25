package dev.groupplanning.android.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.create.CreationScreen
import dev.groupplanning.android.ui.invitation.InvitationScreen
import dev.groupplanning.android.ui.meetings.HomeTabs
import dev.groupplanning.android.ui.meetings.MeetingListScreen
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.savedinvitations.SavedInvitationsScreen

@Composable
internal fun PrivateContent(model: AppViewModel, route: AppRoute, snapshot: ClientSnapshot) {
    val duration = if (LocalMotionEnabled.current) 200 else 0
    AnimatedContent(route, contentKey = {
        when (it) {
            AppRoute.Home -> "home"
            is AppRoute.Create -> it.model
            is AppRoute.Invitation -> it.model
        }
    }, transitionSpec = {
        fadeIn(tween(duration)) togetherWith fadeOut(tween(duration))
    }, label = "route") { destination ->
        when (destination) {
            AppRoute.Home -> Column {
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
                MeetingsHeader(
                    (snapshot.session as SessionState.Authenticated).profile.displayName,
                    model::logout,
                    model::showDeletion,
                )
                if (invitations) {
                    SavedInvitationsScreen(
                        snapshot.data.invitations,
                        tabs = { HomeTabs(invitations, model::selectHomeInvitations) },
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
                        tabs = { HomeTabs(invitations, model::selectHomeInvitations) },
                    )
                }
            }
            is AppRoute.Create -> CreationScreen(destination.model, model::home, model::created)
            is AppRoute.Invitation -> InvitationScreen(destination.model, model::home)
        }
    }
}

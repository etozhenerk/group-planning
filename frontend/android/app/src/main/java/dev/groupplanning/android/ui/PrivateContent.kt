package dev.groupplanning.android.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.create.CreationScreen
import dev.groupplanning.android.ui.invitation.InvitationScreen
import dev.groupplanning.android.ui.meetings.MeetingListScreen
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.motion.LocalMotionEnabled

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
                MeetingsHeader(
                    (snapshot.session as SessionState.Authenticated).profile.displayName,
                    model::logout,
                )
                MeetingListScreen(snapshot.data, model::create, model::refresh, model::loadMore) {
                    model.open(it)
                }
            }
            is AppRoute.Create -> CreationScreen(destination.model, model::home, model::created)
            is AppRoute.Invitation -> InvitationScreen(destination.model, model::home)
        }
    }
}

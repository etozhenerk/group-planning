package dev.groupplanning.android.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.create.CreationScreen
import dev.groupplanning.android.ui.invitation.InvitationScreen
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.service.ServiceDialog

@Composable
internal fun PrivateContent(model: AppViewModel, route: AppRoute, snapshot: ClientSnapshot) {
    val holder = rememberSaveableStateHolder()
    var service by rememberSaveable { mutableStateOf<String?>(null) }
    service?.let { ServiceDialog(it, model.support, { service = it }, { service = null }) }
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
            AppRoute.Home -> holder.SaveableStateProvider("home") {
                HomeScreen(model, snapshot) { service = it }
            }
            is AppRoute.Create -> CreationScreen(destination.model, model::home, model::created)
            is AppRoute.Invitation -> InvitationScreen(destination.model, model::home)
        }
    }
}

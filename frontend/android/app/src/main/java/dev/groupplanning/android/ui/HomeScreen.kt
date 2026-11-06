package dev.groupplanning.android.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.meetings.HomeNavigation
import dev.groupplanning.android.ui.profile.ProfileScreen
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun HomeScreen(model: AppViewModel, snapshot: ClientSnapshot, service: (String) -> Unit) {
    val holder = rememberSaveableStateHolder()
    val selected by model.homeTab.collectAsStateWithLifecycle()
    val logoutBusy by model.logoutBusy.collectAsStateWithLifecycle()
    val logoutFailed by model.logoutFailed.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = Palette.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = { HomeNavigation(selected, model::selectHomeTab) },
    ) { insets ->
        Box(
            Modifier.fillMaxSize().padding(insets).consumeWindowInsets(insets)
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal)),
        ) {
            holder.SaveableStateProvider(selected) {
                if (selected == 2) {
                    model.profile?.let {
                        ProfileScreen(it, { page ->
                            if (page == "support" || page == "idea") {
                                model.support?.preset("profile")
                                if (page == "idea") model.support?.edit { it.copy(kind = "idea") }
                            }
                            service(if (page == "idea") "support" else page)
                        }, model::logout, logoutBusy = logoutBusy, logoutFailed = logoutFailed)
                    }
                } else {
                    HomeMeetings(model, snapshot)
                }
            }
        }
    }
}

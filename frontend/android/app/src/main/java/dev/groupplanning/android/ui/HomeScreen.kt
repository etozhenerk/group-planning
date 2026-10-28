package dev.groupplanning.android.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.meetings.HomeNavigation
import dev.groupplanning.android.ui.profile.ProfileScreen
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun HomeScreen(model: AppViewModel, snapshot: ClientSnapshot, service: (String) -> Unit) {
    val holder = rememberSaveableStateHolder()
    val selected by model.homeTab.collectAsStateWithLifecycle()
    Box(Modifier.fillMaxSize()) {
        Box(
            Modifier.fillMaxSize().padding(
                bottom = DesignTokens.componentNavigationHeight + DesignTokens.spaceS24,
            ),
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
                        }, model::logout)
                    }
                } else {
                    HomeMeetings(model, snapshot)
                }
            }
        }
        Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp)) {
            HomeNavigation(selected, model::selectHomeTab)
        }
    }
}

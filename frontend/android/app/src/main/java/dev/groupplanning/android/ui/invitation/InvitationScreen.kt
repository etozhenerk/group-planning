package dev.groupplanning.android.ui.invitation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.InvitationViewModel
import dev.groupplanning.android.ui.components.AppIcon
import kotlinx.coroutines.delay

@Composable
internal fun InvitationScreen(model: InvitationViewModel, back: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val snapshot by model.snapshot.collectAsStateWithLifecycle()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val details = state.details
    val profile = (snapshot.session as? SessionState.Authenticated)?.profile
    val authenticated = profile != null && state.profileId == profile.id
    val access =
        authenticated &&
            details?.canAccess == true &&
            details.preview.meetingId !in snapshot.data.denied
    BackHandler(onBack = back)
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            try {
                model.refreshIfIdle()
                while (true) {
                    delay(5_000)
                    model.refreshIfIdle()
                }
            } finally {
                model.suspend()
            }
        }
    }
    if (access) {
        val feed = remember(
            model,
            details?.preview?.meetingId,
            profile?.id,
            snapshot.generation,
            snapshot.data.accessVersion(details?.preview?.meetingId),
        ) {
            details?.preview?.meetingId?.let(model::conversation)
        }
        InvitationConversation(
            state,
            snapshot,
            model::choose,
            model::save,
            model::reload,
            back,
            feed,
        )
    } else {
        Column(Modifier.fillMaxSize().testTag("invitation-screen")) {
            TextButton(back, Modifier.padding(horizontal = 12.dp)) {
                AppIcon(R.drawable.ic_back)
                Text(stringResource(R.string.close_invitation))
            }
            Column(
                Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp),
            ) {
                details?.let {
                    InvitationFacts(it.preview)
                    RsvpForm(state, authenticated, model::choose, model::save)
                }
                state.issue?.let {
                    InvitationProblem(it, !state.loading && !state.saving, model::reload)
                }
                if (state.loading && details == null) CircularProgressIndicator()
            }
        }
    }
}

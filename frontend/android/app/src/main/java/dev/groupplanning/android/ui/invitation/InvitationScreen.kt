package dev.groupplanning.android.ui.invitation

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.links.InvitationTarget
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.InvitationViewModel
import dev.groupplanning.android.state.RsvpOutcome
import java.util.UUID
import kotlinx.coroutines.delay

@Composable
internal fun InvitationScreen(
    model: InvitationViewModel,
    back: () -> Unit,
    response: (RsvpOutcome) -> Unit = {},
    authenticating: Boolean = false,
    signIn: () -> Unit = {},
) {
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
    var automaticRouteCompleted by remember(model) { mutableStateOf(false) }
    var routedResponseID by remember(model) { mutableStateOf<UUID?>(null) }
    LaunchedEffect(state.completedResponseID, access) {
        if (authenticated) {
            val requestID = state.completedResponseID
            val outcome = state.completedResponse
            if (requestID != null && outcome != null && routedResponseID != requestID) {
                routedResponseID = requestID
                response(outcome)
            } else if (requestID == null &&
                !automaticRouteCompleted &&
                access &&
                model.target is InvitationTarget.Token
            ) {
                automaticRouteCompleted = true
                response(
                    RsvpOutcome(
                        profile.id,
                        details.preview.meetingId,
                        RsvpAnswer.Going,
                        details.preview.title,
                    ),
                )
            }
        }
    }
    BackHandler(onBack = back)
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            try {
                model.refreshIfIdle(foreground = true)
                while (true) {
                    delay(5_000)
                    model.refreshIfIdle()
                }
            } finally {
                model.suspend()
            }
        }
    }
    LaunchedEffect(details?.preview?.startsAt, details?.preview?.joinClosesAt) {
        val boundary = details?.preview?.joinClosesAt?.instant
            ?: details?.preview?.startsAt?.instant?.minusSeconds(3600)
        if (boundary != null && boundary.isAfter(java.time.Instant.now())) {
            delay(
                java.time.Duration.between(
                    java.time.Instant.now(),
                    boundary,
                ).toMillis().coerceAtLeast(0),
            )
            model.refreshIfIdle()
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
            model::respond,
            model::reload,
            back,
            feed,
            model::reloadInformation,
            model::reloadParticipants,
        )
    } else {
        InvitationPublicSurface(
            state,
            profile,
            back,
            model::respond,
            model::reload,
            authenticating,
            signIn,
        )
    }
}

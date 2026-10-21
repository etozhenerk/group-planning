package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.ClientRuntime
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.data.api.models.InvitationLink
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.ui.brand.BrandMotion
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

internal class AppViewModel(private val runtime: ClientRuntime) : ViewModel() {
    val snapshot = runtime.sessions?.state ?: MutableStateFlow(ClientSnapshot())
    private val mutableRoute = MutableStateFlow<AppRoute>(AppRoute.Home)
    val route = mutableRoute.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    private val mutableElapsed = MutableStateFlow(0L)
    val elapsed = mutableElapsed.asStateFlow()

    init {
        viewModelScope.launch {
            snapshot.map { it.session }.distinctUntilChanged().collect { session ->
                if (session is SessionState.Authenticated) {
                    refresh()
                } else {
                    home()
                }
            }
        }
        restore()
    }

    fun advanceIntro(delta: Long) {
        mutableElapsed.value =
            (elapsed.value + delta.coerceAtLeast(0)).coerceAtMost(BrandMotion.DURATION_NANOS)
    }

    fun restore() {
        mutableReady.value = false
        viewModelScope.launch {
            try {
                runtime.sessions?.restore(runtime.candidate)
            } finally {
                mutableReady.value = true
            }
        }
    }

    fun refresh() {
        viewModelScope.launch { runtime.meetings?.loadMeetings() }
    }
    fun loadMore() {
        viewModelScope.launch { runtime.meetings?.loadMore() }
    }

    fun create() {
        val user = (snapshot.value.session as? SessionState.Authenticated)?.profile ?: return
        val session = runtime.sessions ?: return
        val scope = CoroutineScope(
            viewModelScope.coroutineContext +
                SupervisorJob(viewModelScope.coroutineContext[kotlinx.coroutines.Job]),
        )
        val model = CreationViewModel(user.id, session, runtime.drafts, scope = scope)
        mutableRoute.value = AppRoute.Create(model)
        model.load()
    }

    fun home() {
        (route.value as? AppRoute.Create)?.model?.stop()
        mutableRoute.value = AppRoute.Home
    }

    fun created(result: CreatedMeeting) {
        open(result.meeting.id, result.invitationUrl)
        refresh()
    }

    fun open(id: UUID, invitation: String? = null) {
        (route.value as? AppRoute.Create)?.model?.stop()
        mutableRoute.value = AppRoute.Meeting(id, invitation)
        viewModelScope.launch {
            runtime.meetings?.loadMeeting(id)
            val user = (snapshot.value.session as? SessionState.Authenticated)?.profile
            val meeting = snapshot.value.data.details[id]?.value
            if (invitation == null && meeting != null && meeting.organizerId == user?.id) {
                try {
                    val link = runtime.sessions?.authenticated(
                        MeetingRequests.invitation(id),
                        InvitationLink.serializer(),
                    )
                    if ((route.value as? AppRoute.Meeting)?.id == id) {
                        mutableRoute.value = AppRoute.Meeting(id, link?.invitationUrl)
                    }
                } catch (
                    _: ClientFailure,
                ) { /* Details remain readable; sharing can be retried. */ }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                runtime.sessions?.logout()
            } catch (
                _: ClientFailure,
            ) { /* Local sign-out is authoritative. */ }
        }
    }
}

package dev.groupplanning.android.state

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.ClientRuntime
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.data.auth.AuthContext
import dev.groupplanning.android.data.links.InvitationTarget
import dev.groupplanning.android.data.repository.CalendarRepository
import dev.groupplanning.android.data.repository.SavedInvitationsRepository
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.ui.brand.BrandMotion
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

internal class AppViewModel(
    private val runtime: ClientRuntime,
    initialLink: String?,
    saved: SavedStateHandle = SavedStateHandle(),
) : ViewModel() {
    val snapshot = runtime.sessions?.state ?: MutableStateFlow(ClientSnapshot())
    private val mutableRoute = MutableStateFlow<AppRoute>(AppRoute.Home)
    val route = mutableRoute.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    private val mutableElapsed = MutableStateFlow(0L)
    val elapsed = mutableElapsed.asStateFlow()
    private val mutableLinkProblem = MutableStateFlow<LinkIssue?>(null)
    val linkProblem = mutableLinkProblem.asStateFlow()
    private var navigation: Job? = null
    private var restoration: Job? = null
    val signIn = SignInViewModel(runtime.auth, childScope()) { context ->
        context.token?.let { token ->
            val target = InvitationTarget.Token(token)
            runtime.invitationContext.save(target)
            showInvitation(target)
        }
    }
    val calendar = runtime.sessions?.let {
        CalendarViewModel(CalendarRepository(it), saved, childScope())
    }
    val savedInvitations = runtime.sessions?.let {
        SavedInvitationsViewModel(SavedInvitationsRepository(it), childScope())
    }
    private val mutableHomeInvitations = MutableStateFlow(saved["home-invitations"] ?: false)
    val homeInvitations = mutableHomeInvitations.asStateFlow()
    private val savedHome = saved

    fun selectHomeInvitations(value: Boolean) {
        mutableHomeInvitations.value = value
        savedHome["home-invitations"] = value
    }

    init {
        viewModelScope.launch {
            snapshot.map { it.session }.distinctUntilChanged().collect { session ->
                if (session is SessionState.Authenticated) {
                    refresh()
                } else if (route.value !is AppRoute.Invitation) {
                    clearRoute()
                }
            }
        }
        restore()
        navigation = viewModelScope.launch {
            restoration?.join()
            try {
                if (initialLink != null) {
                    acceptLink(initialLink)
                } else {
                    runtime.invitationContext.load()?.let(::showInvitation)
                }
            } catch (_: ClientFailure) {
                mutableLinkProblem.value = LinkIssue.Storage
            }
        }
    }

    fun signInResult(token: String?, cancelled: Boolean = false) {
        signIn.result(token, cancelled, restoration)
    }

    fun startSignIn() {
        val target = (route.value as? AppRoute.Invitation)?.model?.target
        signIn.start(
            if (target is InvitationTarget.Token) {
                AuthContext(
                    "invitation",
                    target.value,
                )
            } else {
                AuthContext()
            },
        )
    }

    fun advanceIntro(delta: Long) {
        mutableElapsed.value =
            (elapsed.value + delta.coerceAtLeast(0)).coerceAtMost(BrandMotion.DURATION_NANOS)
    }

    fun restore() {
        mutableReady.value = false
        restoration = viewModelScope.launch {
            try {
                runtime.sessions?.restore(runtime.candidate)
            } finally {
                mutableReady.value = true
            }
        }
    }

    fun receiveLink(value: String) {
        val previous = navigation
        navigation = viewModelScope.launch {
            previous?.join()
            acceptLink(value)
        }
    }

    private suspend fun acceptLink(value: String) {
        val target = runtime.links.parse(value)
        if (target == null) {
            mutableLinkProblem.value = LinkIssue.Invalid
            return
        }
        if (runtime.invitations == null) {
            mutableLinkProblem.value = LinkIssue.Unconfigured
            return
        }
        try {
            runtime.invitationContext.save(target)
        } catch (
            _: ClientFailure,
        ) {
            mutableLinkProblem.value = LinkIssue.Storage
        }
        showInvitation(target)
    }

    private fun showInvitation(target: InvitationTarget) {
        val repository = runtime.invitations ?: return
        clearRoute()
        mutableRoute.value =
            AppRoute.Invitation(
                InvitationViewModel(target, repository, childScope(), runtime.feeds),
            )
    }

    fun dismissLinkProblem() {
        mutableLinkProblem.value = null
    }

    fun refresh() {
        if (homeInvitations.value) savedInvitations?.refresh() else calendar?.refresh()
    }
    fun loadMore() {
        calendar?.more()
    }

    fun create() {
        val user = (snapshot.value.session as? SessionState.Authenticated)?.profile ?: return
        val session = runtime.sessions ?: return
        val model = CreationViewModel(
            user.id,
            session,
            runtime.drafts,
            scope = childScope(),
            initialDay = calendar?.selection?.value?.creationDay.takeUnless {
                homeInvitations.value
            },
        )
        mutableRoute.value = AppRoute.Create(model)
        model.load()
    }

    fun home() {
        val previous = navigation
        navigation = viewModelScope.launch {
            previous?.join()
            try {
                runtime.invitationContext.save(null)
                clearRoute()
                refresh()
            } catch (_: ClientFailure) {
                mutableLinkProblem.value = LinkIssue.Storage
            }
        }
    }

    private fun clearRoute() {
        when (val current = route.value) {
            is AppRoute.Create -> current.model.stop()
            is AppRoute.Invitation -> current.model.stop()
            AppRoute.Home -> Unit
        }
        mutableRoute.value = AppRoute.Home
    }

    fun created(result: CreatedMeeting) {
        open(result.meeting.id)
        refresh()
    }

    fun open(id: UUID) {
        showInvitation(InvitationTarget.Meeting(id))
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

    private fun childScope(): CoroutineScope = CoroutineScope(
        viewModelScope.coroutineContext + SupervisorJob(viewModelScope.coroutineContext[Job]),
    )
}

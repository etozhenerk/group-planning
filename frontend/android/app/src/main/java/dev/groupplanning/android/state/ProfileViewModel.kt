package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.data.repository.ServiceRepository
import dev.groupplanning.android.data.session.SessionState
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal data class ProfileState(
    val profile: OwnProfile? = null,
    val loading: Boolean = false,
    val error: Boolean = false,
)

internal class ProfileViewModel(private val repository: ServiceRepository, scope: CoroutineScope) :
    ViewModel(scope) {
    private val mutable = MutableStateFlow(ProfileState())
    val state = mutable.asStateFlow()
    init {
        viewModelScope.launch {
            repository.sessions?.state?.collect { snapshot ->
                if (snapshot.session !is SessionState.Authenticated) mutable.value = ProfileState()
            }
        }
    }
    fun load() {
        val sessions = repository.sessions ?: return
        val generation = sessions.state.value.generation
        if (state.value.loading) return
        mutable.value = ProfileState(loading = true)
        viewModelScope.launch {
            try {
                val profile = repository.profile(generation)
                if (sessions.isCurrent(generation)) mutable.value = ProfileState(profile)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (sessions.isCurrent(generation)) mutable.value = ProfileState(error = true)
            }
        }
    }
}

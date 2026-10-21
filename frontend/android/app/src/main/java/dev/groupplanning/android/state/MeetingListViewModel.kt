package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.repository.MeetingRepository
import dev.groupplanning.android.data.session.ClientSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

internal class MeetingListViewModel(
    private val repository: MeetingRepository,
    scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate),
) : ViewModel(scope) {
    val state: StateFlow<ClientSnapshot> = repository.state
    private var loading: Job? = null

    fun refresh() {
        loading?.cancel()
        loading = viewModelScope.launch { repository.loadMeetings() }
    }
}

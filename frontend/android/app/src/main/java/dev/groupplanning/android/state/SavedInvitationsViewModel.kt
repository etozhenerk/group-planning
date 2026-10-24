package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.repository.SavedInvitationsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal class SavedInvitationsViewModel(
    private val repository: SavedInvitationsRepository,
    scope: CoroutineScope,
) : ViewModel(scope) {
    private var operation: Job? = null

    suspend fun observe() {
        repository.load()
    }

    fun refresh(more: Boolean = false) {
        if (operation?.isActive == true) return
        operation = viewModelScope.launch { repository.load(more) }
    }
}

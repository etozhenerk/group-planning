package dev.groupplanning.android.state.covers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.covers.CoverIssue
import dev.groupplanning.android.data.drafts.CoverDraft
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal data class CoverSelectionState(val busy: Boolean = false, val issue: CoverIssue? = null)

internal class CoverSelectionViewModel(
    scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate),
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(CoverSelectionState())
    val state = mutable.asStateFlow()
    private var operation: Job? = null

    fun select(
        load: suspend () -> PreparedCover?,
        busy: (Boolean) -> Unit,
        change: (CoverDraft) -> Unit,
    ) {
        if (state.value.busy) return
        mutable.value = CoverSelectionState(busy = true)
        busy(true)
        operation = viewModelScope.launch {
            try {
                val image = load()
                mutable.value = CoverSelectionState()
                busy(false)
                image?.let { change(CoverDraft(it)) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: Exception) {
                mutable.value = CoverSelectionState(issue = error as? CoverIssue ?: CoverIssue())
            } finally {
                mutable.value = state.value.copy(busy = false)
                busy(false)
            }
        }
    }

    fun clearError() {
        mutable.value = state.value.copy(issue = null)
    }
    fun stop() {
        operation?.cancel()
        viewModelScope.cancel()
    }
}

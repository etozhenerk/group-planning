package dev.groupplanning.android.state

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.repository.CalendarRepository
import java.time.Clock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

internal class CalendarViewModel(
    private val repository: CalendarRepository,
    private val saved: SavedStateHandle,
    scope: CoroutineScope,
    private val clock: Clock = Clock.systemUTC(),
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(CalendarSelection.restore(saved["calendar-selection"]))
    val selection = mutable.asStateFlow()
    private val revision = MutableStateFlow(0)
    private var pagination: Job? = null

    fun select(value: CalendarSelection) {
        pagination?.cancel()
        mutable.value = value
        saved["calendar-selection"] = value.saved()
    }

    fun refresh() {
        revision.value++
    }

    fun more() {
        if (pagination?.isActive == true) return
        pagination = viewModelScope.launch { repository.more() }
    }

    suspend fun observe() {
        combine(selection, revision) { value, _ -> value }.collectLatest { value ->
            if (value.calendar && value.selectedDay == null && !value.undated) {
                try {
                    val day = repository.firstDay(value.period)
                    if (selection.value == value) select(value.select(day))
                    return@collectLatest
                } catch (_: ClientFailure) {
                    // The normal load exposes the request error and supports retry.
                }
            }
            while (true) {
                if (repository.state.value.data.calendar.more == null) {
                    repository.load(value.filter, value.monthFilter)
                }
                delay(repository.state.value.data.calendar.refreshDelay(clock.instant()))
            }
        }
    }
}

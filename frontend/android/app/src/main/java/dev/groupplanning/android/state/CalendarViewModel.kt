package dev.groupplanning.android.state

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.realtime.ChatSignal
import dev.groupplanning.android.data.repository.CalendarRepository
import java.time.Clock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
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
    private val invalidations: (() -> Flow<ChatSignal>)? = null,
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

    suspend fun observe(): Unit = coroutineScope {
        var connected = false
        var disconnected: Job? = null
        val signals = Channel<ChatSignal>(Channel.CONFLATED)
        invalidations?.let { events ->
            launch {
                events().collect { signal ->
                    // Connection transitions must not be lost in the coalesced hint channel.
                    when (signal) {
                        ChatSignal.Subscribed -> {
                            disconnected?.cancel()
                            connected = true
                            refresh()
                        }
                        ChatSignal.PersonalChanged -> signals.send(signal)
                        ChatSignal.Disconnected -> {
                            connected = false
                            if (disconnected?.isActive != true) {
                                disconnected = launch {
                                    delay(10_000)
                                    refresh()
                                }
                            }
                        }
                        else -> Unit
                    }
                }
            }
            launch {
                while (true) {
                    signals.receive()
                    delay(100)
                    refresh()
                }
            }
        }
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
                val calendar = repository.state.value.data.calendar
                if (connected && calendar.error == null) {
                    val remaining = calendar.page?.nextTransitionAt?.instant?.let {
                        java.time.Duration.between(clock.instant(), it).toMillis()
                    }
                    if (remaining == null || remaining <= 0) awaitCancellation()
                    delay(remaining)
                } else {
                    delay(calendar.refreshDelay(clock.instant()))
                }
            }
        }
    }
}

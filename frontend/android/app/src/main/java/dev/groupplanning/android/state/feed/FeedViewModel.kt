package dev.groupplanning.android.state.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import dev.groupplanning.android.state.preparation.PreparationFormViewModel
import dev.groupplanning.android.state.preparation.PreparationTaskViewModel
import dev.groupplanning.android.state.settings.SettingsViewModel
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.serialization.json.JsonPrimitive

internal class FeedViewModel(val id: UUID, val repository: FeedRepository, scope: CoroutineScope) :
    ViewModel(scope) {
    private val mutable = MutableStateFlow(FeedState())
    val state = mutable.asStateFlow()
    val media = repository.media?.let {
        MediaViewModel(id, it, childScope())
    }
    val reactions = ReactionController(repository, viewModelScope)
    val sender = MessageSender(repository, viewModelScope) {
        mutable.value = state.value.merge(listOf(it))
    }
    private val mutableSettings = MutableStateFlow<SettingsViewModel?>(null)
    val settings = mutableSettings.asStateFlow()
    private val mutablePolls = MutableStateFlow<Map<UUID, DatePollViewModel>>(emptyMap())
    val polls = mutablePolls.asStateFlow()
    private val mutablePlaces = MutableStateFlow<Map<UUID, PlacePollViewModel>>(emptyMap())
    val places = mutablePlaces.asStateFlow()
    private val mutablePlaceCreation = MutableStateFlow<PlacePollViewModel?>(null)
    val placeCreation = mutablePlaceCreation.asStateFlow()
    private val mutableCreation = MutableStateFlow<DatePollViewModel?>(null)
    val pollCreation = mutableCreation.asStateFlow()
    private val mutableTasks = MutableStateFlow<Map<UUID, PreparationTaskViewModel>>(emptyMap())
    val tasks = mutableTasks.asStateFlow()
    private val mutableTaskCreation = MutableStateFlow<PreparationFormViewModel?>(null)
    val taskCreation = mutableTaskCreation.asStateFlow()
    private var savedPollCreation: DatePollViewModel? = null
    private var savedPlaceCreation: PlacePollViewModel? = null
    private var savedTaskCreation: PreparationFormViewModel? = null
    private var access: MeetingAccess? = null
    private var active: CoroutineScope? = null
    private var activeJob: Job? = null
    private val refreshLock = Mutex()

    init {
        viewModelScope.launch {
            repository.snapshot.collect { snapshot ->
                val lease = access ?: return@collect
                val profile = (snapshot.session as? SessionState.Authenticated)?.profile
                if (snapshot.generation != lease.request.generation ||
                    profile?.id != lease.profile.id ||
                    id in snapshot.data.denied ||
                    snapshot.data.accessVersion(id) != lease.request.accessVersion
                ) {
                    activeJob?.cancel()
                    access = null
                    sender.revoke()
                    reactions.revoke()
                    closeSettings()
                    clearPolls()
                    mutable.value = FeedState(revoked = true)
                }
            }
        }
    }

    suspend fun runActive(): Unit = coroutineScope {
        active = this
        activeJob = coroutineContext[Job]
        try {
            if (access == null) {
                access = repository.open(id)
                sender.open(checkNotNull(access))
                media?.open()
                reactions.open(checkNotNull(access))
            }
            var wait = 3_000L
            while (true) {
                val success = refreshNow()
                wait = if (success) 3_000L else (wait * 2).coerceAtMost(30_000L)
                delay(wait)
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            mutable.value = state.value.copy(loadError = true)
        } finally {
            active = null
            activeJob = null
            sender.suspend()
            mutable.value = state.value.copy(loading = false, historyLoading = false)
        }
    }

    fun refresh() {
        active?.launch {
            if (!sender.state.value.ready) {
                access?.let { sender.open(it) }
            } else if (sender.state.value.storageError) {
                sender.edit(sender.state.value.draft)
            }
            refreshNow()
        }
    }

    private suspend fun refreshNow(): Boolean {
        val lease = access ?: return false
        if (!refreshLock.tryLock()) return true
        mutable.value = state.value.copy(loading = true)
        try {
            do {
                val first = !state.value.ready
                val page = repository.page(lease, after = state.value.cursor.takeUnless { first })
                if (access != lease) return false
                mutable.value = state.value.merge(page.entries).copy(
                    ready = true,
                    loadError = false,
                    cursor = page.entries.lastOrNull()?.sequence ?: state.value.cursor,
                    hasHistory = if (first) page.hasMore else state.value.hasHistory,
                )
                sender.acknowledge(page.entries)
                registerPolls(page.entries, lease)
                refreshDetails(lease, page)
                // Initial has_more describes older history, not unread newer pages.
            } while (!first && page.hasMore)
            reactions.refresh()
            return true
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            if (access == lease) mutable.value = state.value.copy(loadError = true)
            return false
        } finally {
            mutable.value = state.value.copy(loading = false)
            refreshLock.unlock()
        }
    }

    private suspend fun refreshDetails(lease: MeetingAccess, page: FeedPage) {
        val current = repository.snapshot.value.data.details[id]?.value
        if (current?.revision != page.meetingRevision) repository.details(lease)
    }

    fun history() {
        val lease = access ?: return
        val before = state.value.entries.firstOrNull()?.sequence ?: return
        if (!state.value.hasHistory || state.value.historyLoading) return
        mutable.value = state.value.copy(historyLoading = true, historyError = false)
        active?.launch {
            try {
                val page = repository.page(lease, before = before)
                if (access == lease) {
                    registerPolls(page.entries, lease)
                    mutable.value = state.value.merge(page.entries).copy(hasHistory = page.hasMore)
                    sender.acknowledge(page.entries)
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(historyError = true)
            } finally {
                mutable.value = state.value.copy(historyLoading = false)
            }
        }
    }

    fun openSettings(meeting: Meeting) {
        val lease = access ?: return
        if (meeting.organizerId != lease.profile.id || settings.value != null) return
        mutableSettings.value = SettingsViewModel(
            meeting,
            repository,
            lease,
            CoroutineScope(
                viewModelScope.coroutineContext + SupervisorJob(
                    viewModelScope.coroutineContext[Job],
                ),
            ),
        )
    }

    fun closeSettings() {
        settings.value?.stop()
        mutableSettings.value = null
    }

    private fun registerPolls(entries: List<FeedEntry>, lease: MeetingAccess) {
        for (entry in entries) {
            if (entry.kind !in
                listOf("date_poll_created", "place_poll_created", "preparation_task_created") ||
                entry.payloadVersion != 1
            ) {
                continue
            }
            val field = if (entry.kind == "preparation_task_created") "task_id" else "poll_id"
            val raw = (entry.payload[field] as? JsonPrimitive)?.content ?: continue
            val poll = runCatching { UUID.fromString(raw) }.getOrNull() ?: continue
            if (entry.kind == "preparation_task_created") {
                if (poll !in
                    tasks.value
                ) {
                    mutableTasks.value =
                        tasks.value +
                        (poll to PreparationTaskViewModel(repository, lease, childScope()))
                }
                continue
            }
            if (entry.kind == "place_poll_created") {
                if (poll !in places.value) {
                    mutablePlaces.value =
                        places.value + (poll to PlacePollViewModel(repository, lease, childScope()))
                }
                continue
            }
            if (poll !in polls.value) {
                mutablePolls.value =
                    polls.value + (poll to DatePollViewModel(repository, lease, childScope()))
            }
        }
    }

    private fun childScope(): CoroutineScope = CoroutineScope(
        viewModelScope.coroutineContext + SupervisorJob(viewModelScope.coroutineContext[Job]),
    )

    fun createPoll(meeting: Meeting) {
        val lease = access ?: return
        if (pollCreation.value == null) {
            mutableCreation.value = savedPollCreation
                ?: DatePollViewModel(repository, lease, childScope(), meeting)
            savedPollCreation = null
        }
    }

    fun closePollCreation() {
        if (pollCreation.value?.state?.value?.pending != null) return
        pollCreation.value?.let { model ->
            if (model.state.value.poll == null) savedPollCreation = model else model.stop()
        }
        mutableCreation.value = null
        refresh()
    }

    fun createPlacePoll(meeting: Meeting) {
        val lease = access ?: return
        if (placeCreation.value ==
            null
        ) {
            mutablePlaceCreation.value = savedPlaceCreation
                ?: PlacePollViewModel(repository, lease, childScope(), meeting)
            savedPlaceCreation = null
        }
    }

    fun closePlaceCreation() {
        if (placeCreation.value?.state?.value?.pending != null) return
        placeCreation.value?.let { model ->
            if (model.state.value.poll == null) savedPlaceCreation = model else model.stop()
        }
        mutablePlaceCreation.value = null
        refresh()
    }

    fun createPreparationTask() {
        val lease = access ?: return
        if (taskCreation.value ==
            null
        ) {
            mutableTaskCreation.value = savedTaskCreation
                ?: PreparationFormViewModel(repository, lease, childScope())
            savedTaskCreation = null
        }
    }

    fun closeTaskCreation() {
        if (taskCreation.value?.operation?.state?.value?.pending != null) return
        taskCreation.value?.let { model ->
            if (model.operation.state.value.task == null) savedTaskCreation = model else model.stop()
        }
        mutableTaskCreation.value = null
        refresh()
    }

    private fun clearPolls() {
        savedPollCreation?.stop()
        savedPollCreation = null
        savedPlaceCreation?.stop()
        savedPlaceCreation = null
        savedTaskCreation?.stop()
        savedTaskCreation = null
        tasks.value.values.forEach { it.stop() }
        mutableTasks.value = emptyMap()
        taskCreation.value?.stop()
        mutableTaskCreation.value = null
        places.value.values.forEach { it.stop() }
        mutablePlaces.value = emptyMap()
        placeCreation.value?.stop()
        mutablePlaceCreation.value = null
        polls.value.values.forEach { it.stop() }
        mutablePolls.value = emptyMap()
        pollCreation.value?.stop()
        mutableCreation.value = null
    }

    fun stop() {
        clearPolls()
        sender.suspend()
        activeJob?.cancel()
        viewModelScope.cancel()
    }
}

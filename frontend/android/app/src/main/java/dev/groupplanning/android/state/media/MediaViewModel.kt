package dev.groupplanning.android.state.media

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.media.SelectedMedia
import dev.groupplanning.android.data.repository.MediaRepository
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionState
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

internal data class UploadItem(
    val value: SelectedMedia,
    val busy: Boolean = false,
    val error: Boolean = false,
)
internal data class MediaState(
    val items: List<UploadItem> = emptyList(),
    val selecting: Boolean = false,
    val selectionError: Boolean = false,
    val photos: List<MeetingMedia> = emptyList(),
    val next: String? = null,
    val loading: Boolean = false,
    val loadError: Boolean = false,
    val revoked: Boolean = false,
    val purpose: String = "message",
    val exportStatus: Int = 0,
    val limits: dev.groupplanning.android.data.api.models.MediaLimits? = null,
)

internal class MediaViewModel(
    val id: UUID,
    val repository: MediaRepository,
    scope: CoroutineScope,
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(MediaState())
    val state = mutable.asStateFlow()
    private var access: MeetingAccess? = null
    private var sending: Job? = null
    private var captionSave: Job? = null
    private val previews = linkedMapOf<UUID, ByteArray>()
    private val previewLock = Mutex()
    private val openLock = Mutex()

    init {
        viewModelScope.launch {
            repository.sessions.state.collect { snapshot ->
                val lease = access ?: return@collect
                val profile = (snapshot.session as? SessionState.Authenticated)?.profile
                if (snapshot.generation != lease.request.generation ||
                    profile?.id != lease.profile.id ||
                    id in snapshot.data.denied ||
                    snapshot.data.accessVersion(id) != lease.request.accessVersion
                ) {
                    sending?.cancel()
                    access = null
                    previews.clear()
                    mutable.value = MediaState(revoked = true)
                }
            }
        }
    }

    private suspend fun ensureOpen(): MeetingAccess = openLock.withLock {
        if (state.value.revoked) throw ClientFailure(FailureKind.AccessRevoked)
        access?.let { return@withLock it }
        val lease = repository.sessions.meetingAccess(id)
        val records = repository.records(lease)
        repository.sessions.withAccess(lease) {
            access = lease
            mutable.value =
                state.value.copy(
                    items = records.map {
                        UploadItem(it, error = it.sourceUri != null)
                    },
                )
        }
        lease
    }

    suspend fun open() {
        try {
            ensureOpen()
        } catch (_: ClientFailure) {
            if (!state.value.revoked) mutable.value = state.value.copy(selectionError = true)
        }
    }

    fun choose(uris: List<Uri>, purpose: String, photo: Boolean) {
        if (uris.isEmpty() || state.value.selecting) return
        mutable.value =
            state.value.copy(selecting = true, selectionError = false, purpose = purpose)
        viewModelScope.launch {
            var selectedAccess: MeetingAccess? = null
            try {
                val lease = ensureOpen()
                selectedAccess = lease
                val limits = repository.limits(lease)
                if (access != lease) return@launch
                mutable.value = state.value.copy(limits = limits)
                if (uris.size + state.value.items.count { !it.value.published } > limits.maxFiles) {
                    mutable.value = state.value.copy(selectionError = true)
                    return@launch
                }
                for (uri in uris) {
                    try {
                        val item = repository.select(lease, uri, purpose, photo, limits)
                        if (access ==
                            lease
                        ) {
                            mutable.value =
                                state.value.copy(
                                    items =
                                    state.value.items +
                                        UploadItem(item, error = item.sourceUri != null),
                                )
                        }
                    } catch (cancelled: CancellationException) {
                        throw cancelled
                    } catch (_: SecurityException) {
                        if (access == lease) mutable.value = state.value.copy(selectionError = true)
                    } catch (_: IOException) {
                        mutable.value =
                            state.value.copy(selectionError = true)
                    } catch (_: ClientFailure) {
                        if (access ==
                            lease
                        ) {
                            mutable.value = state.value.copy(selectionError = true)
                        }
                    }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access ==
                    selectedAccess
                ) {
                    mutable.value = state.value.copy(selectionError = true)
                }
            } finally {
                if (access == selectedAccess) mutable.value = state.value.copy(selecting = false)
            }
        }
    }

    fun caption(key: String, value: String) {
        val lease = access ?: return
        val row = state.value.items.find { it.value.key == key } ?: return
        if (row.busy ||
            row.value.submissionStarted ||
            row.value.published ||
            row.value.contentType.startsWith("image/")
        ) {
            return
        }
        val updated = row.value.copy(caption = value)
        update(key) { it.copy(value = updated) }
        val previous = captionSave
        captionSave = viewModelScope.launch {
            previous?.join()
            try {
                repository.persist(lease, updated)
            } catch (_: IOException) {
                if (access == lease) update(key) { it.copy(error = true) }
            } catch (_: ClientFailure) {
                if (access == lease) update(key) { it.copy(error = true) }
            }
        }
    }

    fun remove(item: SelectedMedia) {
        val lease = access ?: return
        if (state.value.items.any { it.value.key == item.key && it.busy }) return
        viewModelScope.launch {
            try {
                captionSave?.join()
                repository.remove(lease, item)
                if (access ==
                    lease
                ) {
                    mutable.value =
                        state.value.copy(
                            items = state.value.items.filter {
                                it.value.key != item.key
                            },
                        )
                }
            } catch (_: ClientFailure) {
                if (access ==
                    lease
                ) {
                    mutable.value = state.value.copy(selectionError = true)
                }
            }
        }
    }

    fun dismissCompleted(purpose: String) {
        state.value.items.filter { it.value.purpose == purpose && it.value.published }
            .forEach { remove(it.value) }
    }

    fun send(purpose: String) {
        val lease = access ?: return
        if (sending?.isActive == true) return
        val rows = state.value.items.filter { it.value.purpose == purpose && !it.value.published }
        if (rows.any { it.value.caption.codePointCount(0, it.value.caption.length) > 2000 }) return
        rows.forEach { row -> update(row.value.key) { it.copy(busy = true, error = false) } }
        sending = viewModelScope.launch {
            captionSave?.join()
            for (row in rows) {
                update(row.value.key) { it.copy(busy = true, error = false) }
                try {
                    val published = repository.send(lease, row.value) { value ->
                        if (access == lease) update(value.key) { it.copy(value = value) }
                    }
                    if (access == lease) update(published.key) { UploadItem(published) }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: IOException) {
                    if (access ==
                        lease
                    ) {
                        update(row.value.key) { it.copy(busy = false, error = true) }
                    }
                } catch (_: SecurityException) {
                    if (access ==
                        lease
                    ) {
                        update(row.value.key) { it.copy(busy = false, error = true) }
                    }
                } catch (_: ClientFailure) {
                    if (access ==
                        lease
                    ) {
                        update(row.value.key) { it.copy(busy = false, error = true) }
                    }
                } finally {
                    if (access == lease) update(row.value.key) { it.copy(busy = false) }
                }
            }
            if (purpose == "memory") loadMemories()
        }
    }

    private fun update(key: String, transform: (UploadItem) -> UploadItem) {
        mutable.value =
            state.value.copy(
                items = state.value.items.map {
                    if (it.value.key ==
                        key
                    ) {
                        transform(it)
                    } else {
                        it
                    }
                },
            )
    }

    fun loadMemories(more: Boolean = false) {
        val lease = access ?: return
        if (state.value.loading) return
        mutable.value = state.value.copy(loading = true, loadError = false)
        viewModelScope.launch {
            try {
                val page = repository.memories(lease, state.value.next.takeIf { more })
                if (access == lease) {
                    val previous = if (more) state.value.photos else emptyList()
                    val photos = (previous + page.photos).distinctBy { it.id }
                    mutable.value = state.value.copy(
                        photos = photos,
                        next = page.nextCursor,
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access ==
                    lease
                ) {
                    mutable.value = state.value.copy(loadError = true)
                }
            } finally {
                if (access == lease) mutable.value = state.value.copy(loading = false)
            }
        }
    }

    fun export(item: MeetingMedia, uri: Uri?) {
        val lease = access ?: return
        if (uri == null) return
        viewModelScope.launch {
            try {
                repository.export(lease, item, uri)
                if (access == lease) mutable.value = state.value.copy(exportStatus = 1)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access ==
                    lease
                ) {
                    mutable.value = state.value.copy(exportStatus = -1)
                }
            } catch (_: IOException) {
                if (access ==
                    lease
                ) {
                    mutable.value = state.value.copy(exportStatus = -1)
                }
            } catch (_: SecurityException) {
                if (access ==
                    lease
                ) {
                    mutable.value = state.value.copy(exportStatus = -1)
                }
            }
        }
    }

    suspend fun local(item: SelectedMedia): ByteArray = repository.local(
        access ?: throw ClientFailure(FailureKind.AccessRevoked),
        item,
    )
    suspend fun content(item: MeetingMedia): ByteArray = previewLock.withLock {
        val lease = access ?: throw ClientFailure(FailureKind.AccessRevoked)
        repository.sessions.withAccess(lease) { }
        previews.remove(item.id)?.let { bytes ->
            previews[item.id] = bytes
            return@withLock bytes
        }
        val bytes = repository.content(lease, item)
        if (access != lease) throw ClientFailure(FailureKind.AccessRevoked)
        if (item.kind == "photo") {
            previews[item.id] = bytes
            while (previews.size > 3) previews.remove(previews.keys.first())
        }
        bytes
    }

    fun prefetch(photos: List<MeetingMedia>, index: Int) {
        if (photos.size < 2) return
        viewModelScope.launch {
            val next = (index + 1) % photos.size
            val previous = (index + photos.size - 1) % photos.size
            for (item in listOf(next, previous)) {
                try {
                    content(photos[item])
                } catch (_: ClientFailure) { }
            }
        }
    }
}

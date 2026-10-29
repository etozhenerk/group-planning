package dev.groupplanning.android.state.album

import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.SessionState
import java.util.UUID
import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

internal class AlbumDownloadController(
    private val meetingId: UUID,
    private val sessions: SessionRepository,
    private val scope: CoroutineScope,
    private val save: suspend (MeetingAccess, () -> Unit) -> Int,
) {
    private val mutable = MutableStateFlow(AlbumDownloadState.Idle)
    val state = mutable.asStateFlow()
    private val epoch = AtomicLong()
    private var operation: Job? = null
    private var access: MeetingAccess? = null
    private var attached = false

    init {
        scope.launch {
            sessions.state.collect { snapshot ->
                val lease = access ?: return@collect
                val profile = (snapshot.session as? SessionState.Authenticated)?.profile
                if (snapshot.generation != lease.request.generation ||
                    profile?.id != lease.profile.id ||
                    meetingId in snapshot.data.denied ||
                    snapshot.data.accessVersion(meetingId) != lease.request.accessVersion
                ) {
                    invalidate(AlbumDownloadState.Revoked)
                    access = null
                }
            }
        }
    }

    fun enter() {
        attached = true
    }

    fun leave() {
        attached = false
        invalidate(AlbumDownloadState.Idle)
        access = null
    }

    fun start() {
        if (!attached ||
            state.value in listOf(
                AlbumDownloadState.Preparing,
                AlbumDownloadState.Saving,
                AlbumDownloadState.Partial,
                AlbumDownloadState.Revoked,
            )
        ) {
            return
        }
        val previous = operation
        val version = epoch.incrementAndGet()
        mutable.value = AlbumDownloadState.Preparing
        operation = scope.launch {
            try {
                previous?.join()
                val lease = sessions.meetingAccess(meetingId)
                access = lease
                save(lease) { publishing(version) }
                finish(version, AlbumDownloadState.Saved)
            } catch (cancelled: CancellationException) {
                finish(version, AlbumDownloadState.Cancelled)
                throw cancelled
            } catch (failure: AlbumSaveFailure) {
                finish(
                    version,
                    when {
                        failure.issue == AlbumSaveIssue.SavedCleanupPending &&
                            failure.savedCount > 0 -> AlbumDownloadState.Saved
                        state.value == AlbumDownloadState.Saving -> AlbumDownloadState.Partial
                        failure.issue == AlbumSaveIssue.PermissionRequired ->
                            AlbumDownloadState.PermissionRequired
                        failure.issue == AlbumSaveIssue.Storage -> AlbumDownloadState.SaveFailed
                        else -> AlbumDownloadState.Failed
                    },
                )
            } catch (failure: ClientFailure) {
                finish(
                    version,
                    when {
                        failure.kind == FailureKind.AccessRevoked ||
                            failure.kind == FailureKind.StaleSession ||
                            failure.status == 401 ||
                            failure.status == 403 ->
                            AlbumDownloadState.Revoked
                        state.value == AlbumDownloadState.Saving -> AlbumDownloadState.Partial
                        else -> AlbumDownloadState.Failed
                    },
                )
            }
        }
    }

    fun cancel() {
        if (mutable.compareAndSet(AlbumDownloadState.Preparing, AlbumDownloadState.Cancelled)) {
            epoch.incrementAndGet()
            operation?.cancel()
        }
    }

    fun permissionDenied() {
        if (attached) mutable.value = AlbumDownloadState.PermissionRequired
    }

    fun permissionGranted() {
        mutable.compareAndSet(AlbumDownloadState.PermissionRequired, AlbumDownloadState.Idle)
    }

    fun acknowledgePartial() {
        mutable.compareAndSet(AlbumDownloadState.Partial, AlbumDownloadState.Idle)
    }

    private fun publishing(version: Long) {
        mutable.update { current ->
            if (epoch.get() != version || current != AlbumDownloadState.Preparing) {
                throw CancellationException("Album preparation owner changed")
            }
            AlbumDownloadState.Saving
        }
    }

    private fun finish(version: Long, next: AlbumDownloadState) {
        if (epoch.get() == version) mutable.value = next
    }

    private fun invalidate(next: AlbumDownloadState) {
        epoch.incrementAndGet()
        mutable.value = next
        operation?.cancel()
    }
}

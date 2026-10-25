package dev.groupplanning.android.state.covers

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.api.requests.CoverRequests
import dev.groupplanning.android.data.repository.CoverRepository
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

internal sealed interface CoverSource {
    data class Prepared(val image: PreparedCover) : CoverSource
    data class Remote(val url: String, val meeting: UUID) : CoverSource
}

internal data class CoverAccess(val generation: Long, val version: Long, val allowed: Boolean) {
    companion object {
        fun from(snapshot: ClientSnapshot, id: UUID) = CoverAccess(
            snapshot.generation,
            snapshot.data.accessVersion(id),
            snapshot.session is SessionState.Authenticated && id !in snapshot.data.denied,
        )
    }
}

internal data class CoverImageState(
    val bitmap: Bitmap? = null,
    val loading: Boolean = true,
    val access: CoverAccess? = null,
)

internal class CoverImageViewModel(
    private val source: CoverSource,
    private val repository: CoverRepository?,
    private val maximum: Int,
) : ViewModel() {
    private val mutable = MutableStateFlow(CoverImageState())
    val state = mutable.asStateFlow()

    init {
        viewModelScope.launch {
            if (repository == null) {
                mutable.value = CoverImageState(loading = false)
                return@launch
            }
            val private = try {
                source is CoverSource.Remote &&
                    CoverRequests.read(
                        source.url,
                        source.meeting,
                        repository.sessions.api.origin,
                    ).meetingId !=
                    null
            } catch (_: Exception) {
                mutable.value = CoverImageState(loading = false)
                return@launch
            }
            if (private && source is CoverSource.Remote) {
                repository.sessions.state.map {
                    CoverAccess.from(it, source.meeting)
                }.distinctUntilChanged().collectLatest { access ->
                    mutable.value = CoverImageState(loading = access.allowed, access = access)
                    if (access.allowed) load(access)
                }
            } else {
                load(null)
            }
        }
    }

    private suspend fun load(access: CoverAccess?) {
        try {
            val bitmap = when (source) {
                is CoverSource.Prepared -> repository?.preview(source.image)
                is CoverSource.Remote -> repository?.load(source.url, source.meeting, maximum)
            }
            mutable.value = CoverImageState(bitmap, loading = false, access)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            mutable.value = CoverImageState(loading = false, access = access)
        }
    }

    fun stop() {
        viewModelScope.cancel()
        mutable.value = CoverImageState(loading = false)
    }
}

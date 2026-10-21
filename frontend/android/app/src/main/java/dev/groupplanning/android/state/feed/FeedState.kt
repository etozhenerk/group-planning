package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter

internal data class FeedState(
    val entries: List<FeedEntry> = emptyList(),
    val ready: Boolean = false,
    val loading: Boolean = false,
    val historyLoading: Boolean = false,
    val hasHistory: Boolean = false,
    val loadError: Boolean = false,
    val historyError: Boolean = false,
    val revoked: Boolean = false,
    val cursor: ServerCounter? = null,
) {
    fun merge(incoming: List<FeedEntry>): FeedState = copy(
        entries = (entries + incoming).distinctBy { it.id }.sortedBy { it.sequence },
    )
}

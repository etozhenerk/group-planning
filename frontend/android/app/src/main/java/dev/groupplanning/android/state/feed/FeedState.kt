package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter

internal data class FeedState(
    val readEnabled: Boolean = false,
    val readInfo: dev.groupplanning.android.data.api.models.ChatReadInfo? = null,
    val readVersion: ServerCounter = ServerCounter.Zero,
    val divider: java.util.UUID? = null,
    val viewport: dev.groupplanning.android.data.repository.ChatViewport? = null,
    val restoreRevision: Int = 0,
    val focused: java.util.UUID? = null,
    val entries: List<FeedEntry> = emptyList(),
    val ready: Boolean = false,
    val loading: Boolean = false,
    val historyLoading: Boolean = false,
    val hasHistory: Boolean = false,
    val loadError: Boolean = false,
    val historyError: Boolean = false,
    val revoked: Boolean = false,
    val cursor: ServerCounter? = null,
    val changeCursor: String? = null,
    val streamEpoch: String? = null,
    val throughCursor: String? = null,
    val hasNewer: Boolean = false,
    val newerLoading: Boolean = false,
    val newerError: Boolean = false,
    val anchor: java.util.UUID? = null,
    val versions: Map<String, ServerCounter> = emptyMap(),
    val synchronized: Boolean = false,
    val projections: Map<String, dev.groupplanning.android.data.api.models.ChatProjection> =
        emptyMap(),
) {
    fun merge(incoming: List<FeedEntry>, replace: Boolean = true): FeedState {
        val old = entries.associateBy { it.id }
        val additions = if (replace) incoming else incoming.filter { it.id !in old }
        val all = (old + additions.associateBy { it.id }).values.sortedBy { it.sequence }
        val anchorIndex =
            all.indexOfFirst { it.id == (focused ?: anchor) }.takeIf { it >= 0 } ?: all.lastIndex
        val start = (anchorIndex - WINDOW_SIZE / 2).coerceAtLeast(0)
            .coerceAtMost((all.size - WINDOW_SIZE).coerceAtLeast(0))
        val kept = all.drop(start).take(WINDOW_SIZE)
        return copy(
            entries = kept,
            hasHistory = hasHistory || start > 0,
            hasNewer = hasNewer || start + kept.size < all.size,
        )
    }

    private companion object {
        const val WINDOW_SIZE = 500
    }
}

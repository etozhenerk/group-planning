package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.platform.LocalDensity
import dev.groupplanning.android.data.repository.ChatViewport
import dev.groupplanning.android.state.feed.FeedRow
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlin.math.abs
import kotlinx.coroutines.flow.first

internal class TimelinePosition {
    var following by mutableStateOf(true)
    var ready by mutableStateOf(false)
    var adjusting by mutableStateOf(false)
    var movingToTail = false
    var anchor: ChatViewport? = null
}

@Composable
internal fun FeedViewportEffect(
    list: LazyListState,
    rows: List<FeedRow>,
    state: FeedState,
    position: TimelinePosition,
    save: (ChatViewport) -> Unit,
) {
    val density = LocalDensity.current.density
    val threshold = with(LocalDensity.current) { DesignTokens.spaceS64.toPx() }
    LaunchedEffect(list, state.ready, state.restoreRevision) {
        if (!state.ready) return@LaunchedEffect
        position.ready = false
        position.adjusting = true
        val saved = state.viewport
        val restoredId = saved?.entry?.takeIf { id -> rows.any { it.entry?.id == id } }
        val offset = saved?.offsetDp?.takeIf { restoredId != null } ?: 0f
        val target = restoredId
            ?: state.readInfo?.firstUnread.takeUnless { saved?.following == true }
                ?.takeIf { id -> rows.any { it.entry?.id == id } }
        val index = rows.asReversed().indexOfFirst { it.entry?.id == target }.coerceAtLeast(0) +
            if (state.newerLoading || state.newerError) 1 else 0
        position.following = target == null && !state.hasNewer
        position.anchor = target?.let { ChatViewport(it, offset, false) }
        if (rows.isNotEmpty()) {
            list.scrollToItem(index)
            val item = snapshotFlow { list.layoutInfo.visibleItemsInfo.find { it.index == index } }
                .first { it != null }
            if (target != null && item != null) {
                val desired =
                    offset * density
                val top = list.layoutInfo.viewportEndOffset - item.offset - item.size
                list.scrollBy(-(top - desired))
            }
        }
        position.adjusting = false
        position.ready = true
    }
    LaunchedEffect(list, rows, state.hasNewer, density) {
        val reversed = rows.asReversed()
        snapshotFlow { list.layoutInfo to list.isScrollInProgress }.collect { (layout, scrolling) ->
            if (!position.ready || position.adjusting || reversed.isEmpty()) return@collect
            if (scrolling && !position.movingToTail) {
                position.following = !state.hasNewer &&
                    list.firstVisibleItemIndex == 0 &&
                    list.firstVisibleItemScrollOffset <= threshold
            }
            if (position.following && !state.hasNewer) {
                val value = ChatViewport(null, 0f, true)
                position.anchor = value
                save(value)
                return@collect
            }
            val saved = position.anchor
            val existing = layout.visibleItemsInfo.find {
                reversed.find { row -> row.key == it.key }?.entry?.id == saved?.entry
            }
            if (!scrolling && saved?.entry != null) {
                if (existing == null) {
                    val index = reversed.indexOfFirst { it.entry?.id == saved.entry }
                    if (index >= 0) {
                        position.adjusting = true
                        try {
                            list.scrollToItem(
                                index + if (state.newerLoading || state.newerError) 1 else 0,
                            )
                            val restored = list.layoutInfo.visibleItemsInfo.find {
                                it.key == reversed[index].key
                            }
                            if (restored != null) {
                                val top =
                                    list.layoutInfo.viewportEndOffset - restored.offset -
                                        restored.size
                                list.scrollBy(saved.offsetDp * density - top)
                            }
                        } finally {
                            position.adjusting = false
                        }
                        return@collect
                    }
                } else {
                    val desired = saved.offsetDp * density
                    val top = layout.viewportEndOffset - existing.offset - existing.size
                    val difference = top - desired
                    if (abs(difference) > density) {
                        position.adjusting = true
                        try {
                            list.scrollBy(-difference)
                        } finally {
                            position.adjusting = false
                        }
                        return@collect
                    }
                }
            }
            val first = layout.visibleItemsInfo.filter {
                reversed.find { row -> row.key == it.key }?.entry != null &&
                    it.offset + it.size > layout.viewportStartOffset &&
                    it.offset < layout.viewportEndOffset
            }.minByOrNull { layout.viewportEndOffset - it.offset - it.size } ?: return@collect
            val id = reversed.find { it.key == first.key }?.entry?.id ?: return@collect
            val value =
                ChatViewport(
                    id,
                    (layout.viewportEndOffset - first.offset - first.size) / density,
                    false,
                )
            position.anchor = value
            save(value)
        }
    }
    LaunchedEffect(rows.lastOrNull()?.key) {
        if (position.ready && position.following && !state.hasNewer && rows.isNotEmpty()) {
            list.scrollToItem(0)
        }
    }
}

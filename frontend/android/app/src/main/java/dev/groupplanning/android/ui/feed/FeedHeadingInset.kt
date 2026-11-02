package dev.groupplanning.android.ui.feed

import dev.groupplanning.android.state.feed.FeedRow
import dev.groupplanning.android.state.feed.FeedState
import java.time.ZoneId
import java.util.UUID

internal fun feedHeadingInset(rows: List<FeedRow>, id: UUID, height: Float): Float? {
    val index = rows.indexOfFirst { it.entry?.id == id }
    if (index < 0) return null
    val zone = ZoneId.systemDefault()
    val day = rows[index].time.instant.atZone(zone).toLocalDate()
    val previous = rows.getOrNull(index - 1)?.time?.instant?.atZone(zone)?.toLocalDate()
    return if (day == previous) 0f else height.takeIf { it > 0f }
}

internal fun feedLeadingInset(
    rows: List<FeedRow>,
    state: FeedState,
    id: UUID,
    headingHeight: Float,
    unreadHeight: Float,
): Float? {
    val heading = feedHeadingInset(rows, id, headingHeight) ?: return null
    val hasDivider = state.readEnabled && state.divider == id
    if (hasDivider && unreadHeight <= 0f) return null
    return heading + if (hasDivider) unreadHeight else 0f
}

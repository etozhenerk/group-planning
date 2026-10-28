package dev.groupplanning.android.ui.feed

import dev.groupplanning.android.state.feed.FeedRow
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

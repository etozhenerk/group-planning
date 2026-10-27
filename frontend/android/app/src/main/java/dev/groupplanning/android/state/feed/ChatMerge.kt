package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.ChatChanges
import dev.groupplanning.android.data.api.models.ChatProjection
import dev.groupplanning.android.data.api.models.ChatSnapshot

internal data class ChatMerge(val state: FeedState, val projections: List<ChatProjection>)

internal fun FeedState.install(snapshot: ChatSnapshot): ChatMerge {
    val next = copy(
        entries = snapshot.entries, ready = true, loadError = false,
        readInfo = snapshot.readInfo, readVersion = snapshot.version,
        divider = if (ready) divider else snapshot.firstUnread,
        restoreRevision = restoreRevision + 1,
        changeCursor = snapshot.cursor, streamEpoch = snapshot.epoch, throughCursor = null,
        hasHistory = snapshot.hasOlder, hasNewer = snapshot.hasNewer, synchronized = true,
        versions = snapshot.projections.associate { it.key to it.version },
        projections = snapshot.projections.associateBy { it.key },
    )
    return ChatMerge(next, snapshot.projections)
}

internal fun FeedState.apply(page: ChatChanges): ChatMerge {
    if (page.epoch != streamEpoch ||
        throughCursor != null &&
        page.through != throughCursor ||
        page.hasMore &&
        page.cursor == changeCursor
    ) {
        throw ClientFailure(FailureKind.InvalidResponse)
    }
    var next = this
    val projections = mutableListOf<ChatProjection>()
    for (change in page.changes) {
        if (change.kind == "history_invalidated") throw ChatHistoryInvalidated()
        val projection = change.projection
        val key = projection?.key ?: "${change.resourceKind}:${change.resourceId ?: change.entryId}"
        if (change.version <=
            (next.versions[key] ?: dev.groupplanning.android.data.api.models.ServerCounter.Zero)
        ) {
            continue
        }
        if (projection != null) {
            if (!projection.validFor(page.meeting.id) ||
                projection.version != change.version ||
                projection.entry?.meetingId?.let { it != page.meeting.id } == true ||
                projection.datePoll?.meetingId?.let { it != page.meeting.id } == true ||
                projection.placePoll?.meetingId?.let { it != page.meeting.id } == true ||
                projection.task?.meetingId?.let { it != page.meeting.id } == true
            ) {
                throw ClientFailure(FailureKind.InvalidResponse)
            }
            projection.entry?.let { entry ->
                if (!next.hasNewer || next.entries.any { it.id == entry.id }) {
                    next = next.merge(listOf(entry))
                }
            }
            projections += projection
            next = next.copy(
                projections = (next.projections + (key to projection))
                    .toList().takeLast(500).toMap(),
            )
        }
        if (change.kind == "entry_removed") {
            next = next.copy(entries = next.entries.filterNot { it.id == change.entryId })
        }
        // The visible store is bounded, including stale projection guards.
        next = next.copy(
            versions = (next.versions + (key to change.version)).toList()
                .takeLast(1_000).toMap(),
        )
    }
    return ChatMerge(
        next.copy(
            readInfo = if (page.version >= readVersion) page.readInfo else readInfo,
            readVersion = maxOf(readVersion, page.version),
            changeCursor = page.cursor,
            throughCursor = page.through.takeIf { page.hasMore },
            ready = true,
            loadError = false,
        ),
        projections,
    )
}

internal class ChatHistoryInvalidated : Exception()

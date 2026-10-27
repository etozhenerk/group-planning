package dev.groupplanning.android.ui.placepoll

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import java.util.UUID

@Composable
internal fun PlacePollRoute(
    id: UUID,
    model: PlacePollViewModel,
    meeting: Meeting,
    entry: FeedEntry,
) {
    val state by model.state.collectAsStateWithLifecycle()
    PlacePollCard(
        state,
        meeting,
        entry,
        model::vote,
        retry = { if (state.pending != null) model.retry() else model.reload(id) },
    )
}

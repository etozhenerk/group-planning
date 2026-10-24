package dev.groupplanning.android.ui.placepoll

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import java.util.UUID
import kotlinx.coroutines.delay

@Composable
internal fun PlacePollRoute(
    id: UUID,
    model: PlacePollViewModel,
    meeting: Meeting,
    entry: FeedEntry,
    own: Boolean,
) {
    val state by model.state.collectAsStateWithLifecycle()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                model.load(id)
                delay(3_000)
            }
        }
    }
    PlacePollCard(
        state,
        meeting,
        entry,
        own,
        model::vote,
        retry = { if (state.pending != null) model.retry() else model.reload(id) },
    )
}

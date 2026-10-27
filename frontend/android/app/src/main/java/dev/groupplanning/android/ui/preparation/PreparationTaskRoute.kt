package dev.groupplanning.android.ui.preparation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.state.preparation.PreparationTaskViewModel
import java.util.UUID

@Composable
internal fun PreparationTaskRoute(id: UUID, model: PreparationTaskViewModel, entry: FeedEntry) {
    val state by model.state.collectAsStateWithLifecycle()
    PreparationTaskCard(state, entry, model.userId, model::act, retry = {
        if (state.pending !=
            null
        ) {
            model.retry()
        } else {
            model.reload(id)
        }
    })
}

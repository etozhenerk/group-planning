package dev.groupplanning.android.ui.preparation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.state.preparation.PreparationTaskViewModel
import java.util.UUID
import kotlinx.coroutines.delay

@Composable
internal fun PreparationTaskRoute(
    id: UUID,
    model: PreparationTaskViewModel,
    entry: FeedEntry,
    own: Boolean,
) {
    val state by model.state.collectAsStateWithLifecycle()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                model.load(id)
                if (model.state.value.task?.state in
                    listOf("completed", "declined", "cancelled")
                ) {
                    break
                }
                delay(3_000)
            }
        }
    }
    PreparationTaskCard(state, entry, own, model.userId, model::act, retry = {
        if (state.pending !=
            null
        ) {
            model.retry()
        } else {
            model.reload(id)
        }
    })
}

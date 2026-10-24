package dev.groupplanning.android.ui.datepoll

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import java.util.UUID
import kotlinx.coroutines.delay
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun DatePollRoute(
    id: UUID,
    model: DatePollViewModel,
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
    DatePollCard(
        state,
        meeting,
        entry,
        own,
        DatePollActions(
            choose = model::choose,
            vote = model::vote,
            add = { model.action("options", mapOf("date" to JsonPrimitive(it))) },
            resolve = { option, time ->
                model.action(
                    "resolve",
                    buildMap {
                        put("option_id", JsonPrimitive(option.toString()))
                        time?.let { put("starts_at", it) }
                    },
                )
            },
            retry = { if (state.pending != null) model.retry() else model.reload(id) },
        ),
    )
}

internal data class DatePollActions(
    val choose: (UUID) -> Unit,
    val vote: (Boolean) -> Unit,
    val add: (String) -> Unit,
    val resolve: (UUID, JsonElement?) -> Unit,
    val retry: () -> Unit,
)

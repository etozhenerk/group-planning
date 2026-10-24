package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.ui.datepoll.CreateDatePollSheet
import dev.groupplanning.android.ui.datepoll.DatePollRoute
import dev.groupplanning.android.ui.placepoll.CreatePlacePollSheet
import dev.groupplanning.android.ui.placepoll.PlacePollRoute
import dev.groupplanning.android.ui.preparation.CreatePreparationTaskSheet
import dev.groupplanning.android.ui.preparation.PreparationTaskRoute
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun FeedScreen(model: FeedViewModel, profile: UserProfile, modifier: Modifier = Modifier) {
    val state by model.state.collectAsStateWithLifecycle()
    val messages by model.sender.state.collectAsStateWithLifecycle()
    val snapshot by model.repository.snapshot.collectAsStateWithLifecycle()
    val polls by model.polls.collectAsStateWithLifecycle()
    val creation by model.pollCreation.collectAsStateWithLifecycle()
    val places by model.places.collectAsStateWithLifecycle()
    val placeCreation by model.placeCreation.collectAsStateWithLifecycle()
    val tasks by model.tasks.collectAsStateWithLifecycle()
    val taskCreation by model.taskCreation.collectAsStateWithLifecycle()
    val meeting = snapshot.data.details[model.id]?.value
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) { model.runActive() }
    }
    if (state.revoked) return
    creation?.let { CreateDatePollSheet(it, model::closePollCreation) }
    placeCreation?.let { CreatePlacePollSheet(it, model::closePlaceCreation) }
    taskCreation?.let { CreatePreparationTaskSheet(it, model::closeTaskCreation) }
    Column(modifier.imePadding()) {
        FeedTimeline(
            state,
            messages,
            profile,
            model::history,
            model.sender::retry,
            model.sender::recoverRejected,
            poll = { entry ->
                val field = if (entry.kind == "preparation_task_created") "task_id" else "poll_id"
                val raw = (entry.payload[field] as? JsonPrimitive)?.content
                val id = raw?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                val poll = polls[id]
                val place = places[id]
                val task = tasks[id]
                if (task != null && id != null && entry.kind == "preparation_task_created") {
                    PreparationTaskRoute(id, task, entry, entry.actor.id == profile.id)
                } else if (place != null &&
                    meeting != null &&
                    id != null &&
                    entry.kind == "place_poll_created"
                ) {
                    PlacePollRoute(id, place, meeting, entry, entry.actor.id == profile.id)
                } else if (poll != null && meeting != null && id != null) {
                    DatePollRoute(id, poll, meeting, entry, entry.actor.id == profile.id)
                }
            },
            modifier = Modifier.weight(1f),
        )
        if (state.loadError || messages.storageError) {
            TextButton(model::refresh, Modifier.padding(horizontal = 16.dp)) {
                Text(
                    stringResource(
                        if (messages.storageError) {
                            R.string.message_storage_error
                        } else {
                            R.string.feed_load_error
                        },
                    ),
                    color = Palette.error,
                )
            }
        }
        Column(
            Modifier.padding(horizontal = 16.dp).padding(bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MessageComposer(
                messages,
                model.sender::edit,
                model.sender::send,
                openPoll = { meeting?.let(model::createPoll) },
                openPlace = { meeting?.let(model::createPlacePoll) },
                openTask = model::createPreparationTask,
            )
        }
    }
}

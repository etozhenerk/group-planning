package dev.groupplanning.android.ui.feed

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.ui.datepoll.CreateDatePollSheet
import dev.groupplanning.android.ui.datepoll.DatePollRoute
import dev.groupplanning.android.ui.invitation.InviteFriends
import dev.groupplanning.android.ui.media.MemoriesGallery
import dev.groupplanning.android.ui.media.MemoryBanner
import dev.groupplanning.android.ui.media.MessageAttachment
import dev.groupplanning.android.ui.media.UploadSheet
import dev.groupplanning.android.ui.placepoll.CreatePlacePollSheet
import dev.groupplanning.android.ui.placepoll.PlacePollRoute
import dev.groupplanning.android.ui.preparation.CreatePreparationTaskSheet
import dev.groupplanning.android.ui.preparation.PreparationTaskRoute
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun FeedScreen(
    model: FeedViewModel,
    profile: UserProfile,
    modifier: Modifier = Modifier,
    shareUrl: String? = null,
) {
    val media = model.media
    val mediaState = media?.state?.collectAsStateWithLifecycle()?.value
    var upload by rememberSaveable {
        mutableStateOf<String?>(null)
    }
    var gallery by rememberSaveable {
        mutableStateOf(false)
    }
    var purpose by rememberSaveable {
        mutableStateOf("message")
    }
    val photos = rememberLauncherForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia(10),
    ) { uris ->
        if (uris.isNotEmpty()) {
            media?.choose(uris, purpose, true)
            upload = purpose
        }
    }
    val files = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenMultipleDocuments(),
    ) { uris ->
        if (uris.isNotEmpty()) {
            media?.choose(uris, "message", false)
            upload = "message"
        }
    }
    val pickPhotos: (String) -> Unit = { target ->
        purpose = target
        photos.launch(
            PickVisualMediaRequest(
                ActivityResultContracts.PickVisualMedia.ImageOnly,
            ),
        )
    }
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
    LaunchedEffect(state.ready, meeting?.period) {
        if (state.ready &&
            meeting?.period == MeetingPeriod.Past
        ) {
            media?.loadMemories()
        }
    }
    upload?.let { kind ->
        media?.let {
            UploadSheet(it, kind, { upload = null }, more = {
                if (mediaState?.items?.any { row ->
                        !row.value.contentType.startsWith("image/")
                    } == true
                ) {
                    files.launch(arrayOf("application/pdf", "text/plain", "application/zip"))
                } else {
                    pickPhotos(kind)
                }
            })
        }
    }
    if (gallery) {
        media?.let {
            MemoriesGallery(
                meeting?.title.orEmpty(),
                it,
                {
                    pickPhotos("memory")
                },
                {
                    gallery =
                        false
                },
                subtitle = listOfNotNull(
                    meeting?.startsAt?.instant?.atZone(ZoneId.of(meeting.timezone))?.format(
                        DateTimeFormatter.ofPattern("d MMMM", Locale.forLanguageTag("ru")),
                    ) ?: meeting?.startsOn?.let { date ->
                        LocalDate.parse(date).format(
                            DateTimeFormatter.ofPattern("d MMMM", Locale.forLanguageTag("ru")),
                        )
                    },
                    meeting?.place,
                ).joinToString(" · "),
            )
        }
    }
    creation?.let { CreateDatePollSheet(it, model::closePollCreation) }
    placeCreation?.let { CreatePlacePollSheet(it, model::closePlaceCreation) }
    taskCreation?.let { CreatePreparationTaskSheet(it, model::closeTaskCreation) }
    Column(modifier.imePadding()) {
        if (meeting?.period == MeetingPeriod.Past &&
            media != null
        ) {
            MemoryBanner(mediaState?.photos.orEmpty(), media) {
                if (mediaState?.photos.isNullOrEmpty()) pickPhotos("memory") else gallery = true
            }
        }
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
            reaction = { MessageReactions(it, model.reactions) },
            openReaction = { model.reactions.pick(it.id) },
            attachment = { item ->
                media?.let { MessageAttachment(item, it) }
            },
            visible = model.reactions::visible,
            empty = { shareUrl?.let { InviteFriends(it) } },
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
        if (mediaState?.items?.any { !it.value.published && it.value.purpose == "message" } ==
            true
        ) {
            TextButton({ upload = "message" }) { Text(stringResource(R.string.upload_send)) }
        }
        if (mediaState?.exportStatus != null &&
            mediaState.exportStatus != 0
        ) {
            Text(
                stringResource(
                    if (mediaState.exportStatus >
                        0
                    ) {
                        R.string.media_saved
                    } else {
                        R.string.media_save_error
                    },
                ),
            )
        }
        Column(
            Modifier.padding(horizontal = 12.dp).padding(top = 8.dp, bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MessageComposer(
                messages,
                model.sender::edit,
                model.sender::send,
                openPoll = { meeting?.let(model::createPoll) },
                openPlace = { meeting?.let(model::createPlacePoll) },
                openTask = model::createPreparationTask,
                openPhoto = { pickPhotos("message") },
                openFile = {
                    files.launch(
                        arrayOf("application/pdf", "text/plain", "application/zip", "image/*"),
                    )
                },
            )
        }
    }
}

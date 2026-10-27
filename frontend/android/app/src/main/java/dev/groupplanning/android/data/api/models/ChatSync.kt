@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class ChatCapabilities(
    @SerialName("protocol_version") val protocolVersion: Int,
    val sync: Boolean,
    val realtime: Boolean,
    @SerialName("read_state") val readState: Boolean,
)

@Serializable
internal data class ChatRange(
    @SerialName("first_sequence") val first: ServerCounter?,
    @SerialName("last_sequence") val last: ServerCounter?,
)

@Serializable
internal data class ChatMeeting(
    val id: UUID,
    @SerialName("organizer_id") val organizerId: UUID,
    val title: String,
    val description: String?,
    @SerialName("starts_on") val startsOn: String?,
    @SerialName("starts_at") val startsAt: ApiInstant?,
    val timezone: String,
    val place: String?,
    @SerialName("cover_url") val coverUrl: String?,
    val period: MeetingPeriod,
    val revision: ServerCounter,
    @SerialName("participant_count") val participantCount: Int,
    @SerialName("my_rsvp") val myRsvp: RsvpAnswer?,
    @SerialName("my_rsvp_revision") val myRsvpRevision: ServerCounter,
) {
    fun merge(previous: Meeting): Meeting = previous.copy(
        title = title, organizerId = organizerId, description = description,
        startsOn = startsOn, startsAt = startsAt, timezone = timezone, place = place,
        coverUrl = coverUrl, period = period, revision = revision,
        participantCount = participantCount, myRsvp = myRsvp, myRsvpRevision = myRsvpRevision,
    )
}

@Serializable
internal data class ChatProjection(
    @SerialName("resource_kind") val resourceKind: String,
    @SerialName("resource_id") val resourceId: UUID,
    @SerialName("projection_version") val version: ServerCounter,
    val entry: FeedEntry? = null,
    @SerialName("date_poll") val datePoll: DatePoll? = null,
    @SerialName("place_poll") val placePoll: PlacePoll? = null,
    @SerialName("preparation_task") val task: PreparationTask? = null,
    val reactions: List<EntryReactions>? = null,
) {
    val key: String get() = "$resourceKind:$resourceId"

    fun validFor(meeting: UUID): Boolean {
        val scoped = entry?.meetingId?.let { it == meeting } != false &&
            datePoll?.meetingId?.let { it == meeting } != false &&
            placePoll?.meetingId?.let { it == meeting } != false &&
            task?.meetingId?.let { it == meeting } != false
        val resource = when (resourceKind) {
            "entry" -> entry?.id ?: resourceId.takeIf { reactions != null }
            "date_poll" -> datePoll?.id
            "place_poll" -> placePoll?.id
            "preparation_task" -> task?.id
            else -> null
        }
        return scoped &&
            resource == resourceId &&
            reactions.orEmpty().all { it.entryId == resourceId }
    }
}

@Serializable
internal data class ChatChange(
    val kind: String,
    @SerialName("projection_version") val version: ServerCounter,
    @SerialName("entry_id") val entryId: UUID? = null,
    @SerialName("resource_kind") val resourceKind: String? = null,
    @SerialName("resource_id") val resourceId: UUID? = null,
    val projection: ChatProjection? = null,
)

@Serializable
internal data class ChatSnapshot(
    val mode: String,
    @SerialName("stream_epoch") val epoch: String,
    @SerialName("change_cursor") val cursor: String,
    val entries: List<FeedEntry>,
    val projections: List<ChatProjection>,
    val meeting: ChatMeeting,
    @SerialName("projection_version") val version: ServerCounter,
    @SerialName("latest_sequence") val latestSequence: ServerCounter,
    val range: ChatRange,
    @SerialName("has_older") val hasOlder: Boolean,
    @SerialName("has_newer") val hasNewer: Boolean,
    @SerialName("my_read_state") val actual: ServerCounter? = null,
    @SerialName("unread_baseline_sequence") val baseline: ServerCounter? = null,
    @SerialName("unread_count") val unread: ServerCounter? = null,
    @SerialName("first_unread") val firstUnread: UUID? = null,
) {
    val readInfo: ChatReadInfo? get() = actual?.let { position ->
        baseline?.let { base -> unread?.let { ChatReadInfo(position, base, it, firstUnread) } }
    }
}

@Serializable
internal data class ChatChanges(
    val mode: String,
    @SerialName("stream_epoch") val epoch: String,
    @SerialName("next_cursor") val cursor: String,
    @SerialName("through_cursor") val through: String,
    @SerialName("has_more") val hasMore: Boolean,
    val changes: List<ChatChange>,
    val meeting: ChatMeeting,
    @SerialName("projection_version") val version: ServerCounter,
    @SerialName("my_read_state") val actual: ServerCounter? = null,
    @SerialName("unread_baseline_sequence") val baseline: ServerCounter? = null,
    @SerialName("unread_count") val unread: ServerCounter? = null,
    @SerialName("first_unread") val firstUnread: UUID? = null,
) {
    val readInfo: ChatReadInfo? get() = actual?.let { position ->
        baseline?.let { base -> unread?.let { ChatReadInfo(position, base, it, firstUnread) } }
    }
}

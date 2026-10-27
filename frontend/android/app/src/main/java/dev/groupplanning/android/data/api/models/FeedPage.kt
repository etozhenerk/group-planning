package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class FeedPage(
    val entries: List<FeedEntry>,
    @SerialName("has_more") val hasMore: Boolean,
    @SerialName("meeting_revision") val meetingRevision: ServerCounter,
    @SerialName("participant_count") val participantCount: Int,
    @SerialName("my_rsvp") val myRsvp: RsvpAnswer?,
    @SerialName("my_rsvp_revision") val myRsvpRevision: ServerCounter,
    @SerialName("latest_sequence") val latestSequence: ServerCounter,
    val range: ChatRange? = null,
    @SerialName("has_older") val hasOlder: Boolean? = null,
    @SerialName("has_newer") val hasNewer: Boolean? = null,
)

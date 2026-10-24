@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class PlacePoll(
    val id: UUID,
    @SerialName("meeting_id") val meetingId: UUID,
    val author: UserProfile,
    val place: String,
    @SerialName("previous_place") val previousPlace: String?,
    val state: String,
    val revision: ServerCounter,
    @SerialName("my_vote_revision") val myVoteRevision: ServerCounter,
    @SerialName("my_vote") val myVote: String?,
    @SerialName("votes_for") val votesFor: Int,
    @SerialName("votes_against") val votesAgainst: Int,
    @SerialName("created_at") val createdAt: ApiInstant,
    @SerialName("closes_at") val closesAt: ApiInstant,
    @SerialName("closed_at") val closedAt: ApiInstant?,
    @SerialName("can_vote") val canVote: Boolean,
)

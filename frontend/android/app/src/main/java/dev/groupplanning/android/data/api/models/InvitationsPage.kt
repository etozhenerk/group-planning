package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class SavedInvitation(
    @SerialName("invitation_url") val invitationUrl: String,
    val preview: InvitationPreview,
)

@Serializable
internal data class InvitationsPage(
    val invitations: List<SavedInvitation>,
    @SerialName("next_cursor") val nextCursor: String?,
)

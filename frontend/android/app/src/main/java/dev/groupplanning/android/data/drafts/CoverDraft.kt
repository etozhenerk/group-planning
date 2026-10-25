package dev.groupplanning.android.data.drafts

import dev.groupplanning.android.data.api.models.PreparedCover
import kotlinx.serialization.Serializable

@Serializable
internal data class CoverDraft(val image: PreparedCover? = null)

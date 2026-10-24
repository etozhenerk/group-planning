package dev.groupplanning.android.state.preparation

import dev.groupplanning.android.data.api.models.Participant
import java.util.UUID

internal data class PreparationFormState(
    val title: String = "",
    val recipient: UUID? = null,
    val participants: List<Participant>? = null,
    val loading: Boolean = false,
    val peopleError: Boolean = false,
    val validation: PreparationFormIssue? = null,
)

internal enum class PreparationFormIssue { Title, Recipient }

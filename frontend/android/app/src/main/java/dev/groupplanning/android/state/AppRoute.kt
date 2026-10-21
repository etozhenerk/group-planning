package dev.groupplanning.android.state

import java.util.UUID

internal sealed interface AppRoute {
    data object Home : AppRoute
    data class Create(val model: CreationViewModel) : AppRoute
    data class Meeting(val id: UUID, val invitation: String? = null) : AppRoute
}

package dev.groupplanning.android.state

internal sealed interface AppRoute {
    data object Home : AppRoute
    data class Create(val model: CreationViewModel) : AppRoute
    data class Invitation(val model: InvitationViewModel) : AppRoute
}

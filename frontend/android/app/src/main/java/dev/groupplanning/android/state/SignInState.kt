package dev.groupplanning.android.state

internal data class SignInState(
    val busy: Boolean = false,
    val launchSDK: Boolean = false,
    val problem: Boolean = false,
)

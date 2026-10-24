package dev.groupplanning.android.data.auth

internal interface AuthAttemptStorage {
    fun load(): PendingAuthAttempt?
    fun save(attempt: PendingAuthAttempt?)
}

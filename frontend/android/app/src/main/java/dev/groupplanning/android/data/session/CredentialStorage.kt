package dev.groupplanning.android.data.session

internal interface CredentialStorage {
    fun load(): StoredSession?
    fun save(credential: StoredSession)
    fun clear()
}

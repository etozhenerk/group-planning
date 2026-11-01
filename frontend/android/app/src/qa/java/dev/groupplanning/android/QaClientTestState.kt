package dev.groupplanning.android

import android.content.Context
import java.io.File
import java.util.UUID

/** Separates QA client files between tests while keeping each test's recreation state. */
internal object QaClientTestState {
    private const val FILE_NAME = "qa-client-test-namespace"

    fun begin(context: Context, persistentNamespace: String? = null) {
        check(context.packageName == "dev.groupplanning.android.uitesthost")
        val namespace = persistentNamespace ?: UUID.randomUUID().toString()
        require(namespace.matches(Regex("[a-zA-Z0-9-]{1,64}")))
        File(context.noBackupFilesDir, FILE_NAME).writeText(namespace)
    }

    fun namespace(context: Context, scenario: String): String {
        check(context.packageName == "dev.groupplanning.android.uitesthost")
        val file = File(context.noBackupFilesDir, FILE_NAME)
        val namespace = if (file.isFile) file.readText() else "manual"
        require(namespace.matches(Regex("[a-zA-Z0-9-]{1,64}")))
        val canonical = if (scenario == "invite-rsvp-reentry") "invite-rsvp" else scenario
        return "$namespace-$canonical"
    }
}

package dev.groupplanning.android.data

import android.content.Context
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.drafts.DraftRepository
import dev.groupplanning.android.data.drafts.FileDraftStorage
import dev.groupplanning.android.data.repository.MeetingRepository
import dev.groupplanning.android.data.session.AndroidCredentials
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.io.File
import java.security.MessageDigest

internal class ClientRuntime(
    val sessions: SessionRepository?,
    val drafts: DraftRepository,
    val candidate: StoredSession? = null,
) {
    val meetings: MeetingRepository? = sessions?.let(::MeetingRepository)

    companion object {
        fun create(context: Context, origin: ApiOrigin?): ClientRuntime {
            val identity = origin?.url?.toString() ?: "unconfigured"
            val key = MessageDigest.getInstance("SHA-256").digest(identity.toByteArray())
                .joinToString("") { "%02x".format(it) }
            return ClientRuntime(
                sessions = origin?.let {
                    SessionRepository(ApiClient(it), AndroidCredentials.create(context, it))
                },
                drafts = DraftRepository(
                    FileDraftStorage(File(context.noBackupFilesDir, "drafts/$key")),
                ),
            )
        }
    }
}

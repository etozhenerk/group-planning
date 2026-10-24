package dev.groupplanning.android.data

import android.content.Context
import dev.groupplanning.android.BuildConfig
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.auth.FileAuthAttemptStorage
import dev.groupplanning.android.data.auth.YandexAuthRepository
import dev.groupplanning.android.data.drafts.DraftRepository
import dev.groupplanning.android.data.drafts.FileDraftStorage
import dev.groupplanning.android.data.links.FileInvitationStorage
import dev.groupplanning.android.data.links.InvitationContext
import dev.groupplanning.android.data.links.InvitationLinks
import dev.groupplanning.android.data.outbox.FileMessageStorage
import dev.groupplanning.android.data.outbox.MessageOutbox
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.repository.InvitationRepository
import dev.groupplanning.android.data.repository.MeetingRepository
import dev.groupplanning.android.data.session.AndroidCredentials
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.io.File
import java.security.MessageDigest

internal class ClientRuntime(
    val sessions: SessionRepository?,
    val drafts: DraftRepository,
    val links: InvitationLinks,
    val invitationContext: InvitationContext,
    val invitations: InvitationRepository?,
    val candidate: StoredSession? = null,
    val feeds: FeedRepository? = null,
    val auth: YandexAuthRepository? = null,
) {
    val meetings: MeetingRepository? = sessions?.let(::MeetingRepository)

    companion object {
        fun create(
            context: Context,
            origin: ApiOrigin?,
            api: ApiClient? = origin?.let(::ApiClient),
            candidate: StoredSession? = null,
            namespace: String = "",
        ): ClientRuntime {
            val identity = (origin?.url?.toString() ?: "unconfigured") + namespace
            val key = MessageDigest.getInstance("SHA-256").digest(identity.toByteArray())
                .joinToString("") { "%02x".format(it) }
            val outbox = MessageOutbox(
                FileMessageStorage(
                    File(context.noBackupFilesDir, "messages-$key.bin"),
                    SessionCipher(AndroidSessionKey("somewhere.messages.$key"), identity),
                ),
            )
            val sessions = if (api != null && origin != null) {
                SessionRepository(
                    api,
                    AndroidCredentials.create(context, origin),
                    clearPrivate = outbox::clear,
                )
            } else {
                null
            }
            val links = InvitationLinks(origin, BuildConfig.INVITATION_SCHEME)
            return ClientRuntime(
                sessions = sessions,
                drafts = DraftRepository(
                    FileDraftStorage(File(context.noBackupFilesDir, "drafts/$key")),
                ),
                links = links,
                invitationContext = InvitationContext(
                    FileInvitationStorage(
                        File(context.noBackupFilesDir, "invitation-$key.bin"),
                        SessionCipher(AndroidSessionKey("somewhere.invitation.$key"), identity),
                    ),
                ),
                invitations = if (api != null &&
                    sessions != null
                ) {
                    InvitationRepository(api, sessions, links)
                } else {
                    null
                },
                candidate = candidate,
                auth = if (api != null && sessions != null) {
                    YandexAuthRepository(
                        api,
                        sessions,
                        FileAuthAttemptStorage(
                            File(context.noBackupFilesDir, "auth-$key.bin"),
                            SessionCipher(AndroidSessionKey("somewhere.auth.$key"), identity),
                        ),
                    )
                } else {
                    null
                },
                feeds = sessions?.let {
                    FeedRepository(it, outbox)
                },
            )
        }
    }
}

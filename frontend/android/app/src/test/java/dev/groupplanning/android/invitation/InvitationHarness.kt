package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiErrorEnvelope
import dev.groupplanning.android.data.api.models.ApiProblem
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpSnapshot
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.links.InvitationLinks
import dev.groupplanning.android.data.links.InvitationTarget
import dev.groupplanning.android.data.repository.InvitationRepository
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.MemoryCredentials
import dev.groupplanning.android.support.ScriptedTransport
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.serialization.encodeToString

internal class InvitationHarness(dispatcher: CoroutineDispatcher) {
    val token = "QUFBQUFBQUFBQUFBQUFBQQ"
    val target = InvitationTarget.Token(token)
    val transport = ScriptedTransport()
    val api = ApiClient(ApiOrigin("https://example.test"), transport)
    val session = SessionRepository(api, MemoryCredentials(), dispatcher)
    val repository = InvitationRepository(api, session, InvitationLinks(api.origin, "app"))
    val id = Fixtures.meetingId

    suspend fun login() {
        transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        session.restore()
    }

    fun preview(answer: RsvpAnswer? = null, revision: String = "0"): InvitationPreview =
        InvitationPreview(
            id, "Настолки", null, "Europe/Moscow", "У Саши", null, answer,
            ServerCounter(
                revision,
            ),
            "Описание",
        )

    fun denied(answer: RsvpAnswer? = null, revision: String = "0", status: Int = 403): String =
        apiJson.encodeToString(
            ApiErrorEnvelope(
                ApiProblem(
                    if (status == 409) "revision_conflict" else "forbidden",
                    emptyMap(),
                    UUID.randomUUID(),
                    RsvpSnapshot(id, answer, ServerCounter(revision), false, ServerCounter("1")),
                ),
            ),
        )

    fun loadDenied(answer: RsvpAnswer? = null, revision: String = "0") {
        transport.enqueue("invitations/$token", apiJson.encodeToString(preview(answer, revision)))
        transport.enqueue("meetings/$id", denied(answer, revision), 403)
    }
}

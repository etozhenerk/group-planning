package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.InvitationsPage
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.session.SessionRepository
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext

internal class SavedInvitationsRepository(private val session: SessionRepository) {
    val state = session.state

    suspend fun load(more: Boolean = false) {
        var before = SavedInvitationsData()
        val request = UUID.randomUUID()
        val version = session.beginData { data ->
            before = data.invitations
            if (before.request != null || more && before.page?.nextCursor == null) {
                data
            } else {
                data.copy(invitations = before.copy(request = request, error = null))
            }
        } ?: return
        if (state.value.data.invitations.request != request) return
        try {
            var page = fetch(version, if (more) before.page?.nextCursor else null)
            var loaded = 1
            val previous = before.page
            if (more && previous != null) {
                page = merge(previous, page)
                loaded = before.pages + 1
            } else {
                while (loaded < before.pages && page.nextCursor != null) {
                    page = merge(page, fetch(version, page.nextCursor))
                    loaded++
                }
            }
            session.updateData(version) { data ->
                if (data.invitations.request != request) {
                    data
                } else {
                    data.copy(
                        invitations = SavedInvitationsData(page = page, pages = loaded),
                    )
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) { finish(version, request, null) }
            throw cancelled
        } catch (error: ClientFailure) {
            finish(version, request, error)
        }
    }

    private suspend fun fetch(version: Long, cursor: String?): InvitationsPage {
        val page = session.authenticated(
            ApiRequest(
                listOf("invitations"),
                query = buildMap {
                    put("limit", "50")
                    cursor?.let { put("cursor", it) }
                },
            ),
            InvitationsPage.serializer(),
            expectedGeneration = version,
        )
        if (page.invitations.any { it.preview.myRsvp != RsvpAnswer.Maybe }) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return page
    }

    private suspend fun finish(version: Long, request: UUID, error: ClientFailure?) {
        session.updateData(version) { data ->
            if (data.invitations.request != request) {
                data
            } else {
                data.copy(
                    invitations = data.invitations.copy(request = null, error = error),
                )
            }
        }
    }

    private fun merge(first: InvitationsPage, next: InvitationsPage): InvitationsPage = next.copy(
        invitations = (first.invitations + next.invitations).distinctBy { it.preview.meetingId },
    )
}

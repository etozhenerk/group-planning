package dev.groupplanning.android.data.repository

import android.net.Uri
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.FeedbackReceipt
import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.data.media.MediaSelection
import dev.groupplanning.android.data.media.SelectedBytes
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.SessionState
import java.io.IOException
import java.util.UUID

internal class ServiceRepository(
    private val api: ApiClient,
    val sessions: SessionRepository?,
    private val selection: MediaSelection,
    private val drafts: dev.groupplanning.android.data.support.SupportDraftStorage,

) {
    suspend fun loadDraft() = drafts.load()
    suspend fun saveDraft(key: UUID, pending: String?, screenshot: SelectedBytes?) = drafts.save(
        dev.groupplanning.android.data.support.SupportDraft(
            key.toString(),
            pending,
            screenshot?.let {
                dev.groupplanning.android.data.support.SavedScreenshot(
                    it.name,
                    it.type,
                    java.util.Base64.getEncoder().encodeToString(it.bytes),
                )
            },
        ),
    )
    suspend fun clearDraft() = drafts.save(null)

    suspend fun profile(generation: Long): OwnProfile =
        (sessions ?: throw ClientFailure(FailureKind.Http, 401)).authenticated(
            ApiRequest(listOf("me", "profile")),
            OwnProfile.serializer(),
            expectedGeneration = generation,
        ).also { profile ->
            val owner = (sessions?.state?.value?.session as? SessionState.Authenticated)?.profile
            if (profile.id != owner?.id) throw ClientFailure(FailureKind.InvalidResponse)
        }

    suspend fun screenshot(uri: Uri): SelectedBytes {
        val file = selection.read(uri, 5 * 1024 * 1024, false)
        if (file.type !in
            listOf("image/jpeg", "image/png", "image/webp")
        ) {
            throw IOException("Unsupported screenshot")
        }
        return file
    }

    suspend fun feedback(body: String, key: UUID): FeedbackReceipt = api.send(
        ApiRequest(listOf("support", "feedback"), "POST", body, key, 201),
        FeedbackReceipt.serializer(),
    ).also { receipt ->
        if (receipt.status != "accepted" || receipt.reference.isBlank()) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
    }
}

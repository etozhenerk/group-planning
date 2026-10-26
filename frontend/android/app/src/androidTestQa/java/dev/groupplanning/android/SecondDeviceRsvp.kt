package dev.groupplanning.android

import android.content.Intent
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpRequest
import dev.groupplanning.android.data.api.models.RsvpResult
import dev.groupplanning.android.data.api.requests.InvitationRequests
import java.util.UUID
import kotlinx.coroutines.runBlocking

internal class SecondDeviceRsvp(fixture: InvitationUiFixture, scenario: String) {
    private val runtime = RuntimeFactory.create(
        fixture.context,
        Intent().putExtra("scenario", scenario),
    )
    private val api = checkNotNull(runtime.sessions).api
    private val credential = checkNotNull(runtime.candidate)

    fun respond(token: String, answer: RsvpAnswer): RsvpResult = runBlocking {
        val preview = api.send(
            InvitationRequests.preview(token),
            InvitationPreview.serializer(),
            credential,
        )
        api.send(
            InvitationRequests.respond(
                token,
                RsvpRequest(answer, preview.myRsvpRevision),
                UUID.randomUUID(),
            ),
            RsvpResult.serializer(),
            credential,
        )
    }
}

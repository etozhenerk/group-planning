package dev.groupplanning.android.data

import android.content.Context
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.repository.MeetingRepository
import dev.groupplanning.android.data.session.AndroidCredentials
import dev.groupplanning.android.data.session.SessionRepository

internal class ClientRuntime(context: Context, origin: ApiOrigin) {
    val sessions = SessionRepository(ApiClient(origin), AndroidCredentials.create(context, origin))
    val meetings = MeetingRepository(sessions)
}

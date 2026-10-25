package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import java.util.UUID
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

internal object CoverRequests {
    fun read(value: String, meeting: UUID, origin: ApiOrigin): ApiRequest {
        val url = value.toHttpUrlOrNull() ?: throw ClientFailure(FailureKind.InvalidRequest)
        val path = url.pathSegments
        val private = path.getOrNull(2) == "meetings"
        val version = url.queryParameter("v")
        val valid = url.isHttps &&
            url.host == origin.url.host &&
            url.port == origin.url.port &&
            url.username.isEmpty() &&
            url.password.isEmpty() &&
            url.fragment == null &&
            path.size == 5 &&
            path.take(2) == listOf("api", "v1") &&
            path.last() == "cover" &&
            (
                if (private) {
                    path[3] == meeting.toString()
                } else {
                    path[2] == "invitations" &&
                        path[3].matches(Regex("[A-Za-z0-9_-]{22,128}"))
                }
                ) &&
            url.querySize == 1 &&
            version?.matches(Regex("[a-f0-9]{64}")) == true
        if (!valid) throw ClientFailure(FailureKind.InvalidRequest)
        return ApiRequest(
            path.drop(2),
            query = mapOf("v" to checkNotNull(version)),
            meetingId = meeting.takeIf {
                private
            },
            revokesAccessOnForbidden = private,
        )
    }
}

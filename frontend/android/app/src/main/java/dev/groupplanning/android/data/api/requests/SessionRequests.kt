package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest

internal object SessionRequests {
    val Me = ApiRequest(path = listOf("me"))
    val Logout = ApiRequest(path = listOf("auth", "logout"), method = "POST", expectedStatus = 204)
}

package dev.groupplanning.android.data.api

import java.util.UUID

internal class ApiRequest(
    val path: List<String>,
    val method: String = "GET",
    val body: String? = null,
    val key: UUID? = null,
    val expectedStatus: Int = 200,
    val query: Map<String, String> = emptyMap(),
    val meetingId: UUID? = null,
    val revokesAccessOnForbidden: Boolean = false,
    val binary: ByteArray? = null,
    val contentType: String = "application/json",
    val repeatedQuery: List<Pair<String, String>> = emptyList(),
    val deletionToken: String? = null,
) {
    override fun toString(): String = "ApiRequest(redacted)"
}

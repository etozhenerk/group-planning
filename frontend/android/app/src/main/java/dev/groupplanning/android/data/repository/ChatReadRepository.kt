package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.ChatMessageReaders
import dev.groupplanning.android.data.api.models.ChatReadInfo
import dev.groupplanning.android.data.api.models.ChatReadReceipts
import dev.groupplanning.android.data.api.models.ChatReadState
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import java.util.UUID
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject

internal class ChatReadRepository(private val session: SessionRepository) {
    suspend fun mark(access: MeetingAccess, position: ServerCounter): ChatReadState {
        val response = session.authenticated(
            request(
                access,
                listOf("read-marker"),
                "PUT",
                buildJsonObject {
                    put("read_through_sequence", JsonPrimitive(position.value))
                }.toString(),
            ),
            ChatReadState.serializer(),
            expectedLease = access.request,
        )
        if (response.actual < position) throw ClientFailure(FailureKind.InvalidResponse)
        publish(access, response.info, response.version)
        return response
    }

    suspend fun receipts(access: MeetingAccess, entries: List<UUID>): ChatReadReceipts {
        require(entries.isNotEmpty() && entries.size <= 100 && entries.distinct() == entries)
        val result = session.authenticated(
            request(
                access,
                listOf("read-receipts", "query"),
                "POST",
                buildJsonObject {
                    put("entry_ids", JsonArray(entries.map { JsonPrimitive(it.toString()) }))
                }.toString(),
            ),
            ChatReadReceipts.serializer(),
            expectedLease = access.request,
        )
        if (result.receipts.map { it.entry }.toSet() != entries.toSet() ||
            result.receipts.size != entries.size
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return result
    }

    suspend fun readers(access: MeetingAccess, entry: UUID, cursor: String?): ChatMessageReaders {
        val response = session.authenticated(
            request(
                access,
                listOf("messages", entry.toString(), "readers"),
                query = buildMap {
                    put("limit", "50")
                    cursor?.let { put("cursor", it) }
                },
            ),
            ChatMessageReaders.serializer(),
            expectedLease = access.request,
        )
        if (response.readers.size > 50 ||
            response.readers.any { it.id == access.profile.id } ||
            response.readers.map { it.id }.distinct().size != response.readers.size ||
            response.cursor != null &&
            (response.cursor == cursor || response.readers.isEmpty())
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return response
    }

    suspend fun publish(access: MeetingAccess, info: ChatReadInfo, version: ServerCounter) {
        session.updateAccessData(access) { data ->
            if (version < (data.readVersions[access.id] ?: ServerCounter.Zero)) {
                data
            } else {
                data.copy(
                    readVersions = data.readVersions + (access.id to version),
                    chatReadInfo = data.chatReadInfo + (access.id to info),
                    meetings = data.meetings.copy(
                        value = data.meetings.value?.let { page ->
                            page.copy(
                                meetings = page.meetings.map {
                                    if (it.id == access.id) {
                                        it.copy(
                                            unreadCount = info.unread,
                                            firstUnread = info.firstUnread,
                                        )
                                    } else {
                                        it
                                    }
                                },
                            )
                        },
                    ),
                    calendar = data.calendar.copy(
                        cachedPages = data.calendar.cachedPages.mapValues { (_, page) ->
                            page.copy(
                                meetings = page.meetings.map {
                                    if (it.id == access.id) {
                                        it.copy(
                                            unreadCount = info.unread,
                                            firstUnread = info.firstUnread,
                                        )
                                    } else {
                                        it
                                    }
                                },
                            )
                        },
                        page = data.calendar.page?.let { page ->
                            page.copy(
                                meetings = page.meetings.map {
                                    if (it.id == access.id) {
                                        it.copy(
                                            unreadCount = info.unread,
                                            firstUnread = info.firstUnread,
                                        )
                                    } else {
                                        it
                                    }
                                },
                            )
                        },
                    ),
                )
            }
        }
    }

    private fun request(
        access: MeetingAccess,
        path: List<String>,
        method: String = "GET",
        body: String? = null,
        query: Map<String, String> = emptyMap(),
    ) = ApiRequest(
        listOf("meetings", access.id.toString()) + path,
        method,
        body,
        query = query,
        meetingId = access.id,
        revokesAccessOnForbidden = true,
    )
}

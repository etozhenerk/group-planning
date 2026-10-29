package dev.groupplanning.android.data.album

import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
internal enum class AlbumPendingPhase { Preparing, Publishing }

@Serializable
internal data class AlbumPendingRecord(
    val version: Int,
    val operationId: String,
    val phase: AlbumPendingPhase,
) {
    init {
        require(version == 1)
        require(operationId == UUID.fromString(operationId).toString())
    }

    val filePrefix: String get() = "somewhere-$operationId-"
}

package dev.groupplanning.android.data.api.models

import java.time.Instant
import java.time.OffsetDateTime
import kotlinx.serialization.Serializable

@Serializable(with = InstantSerializer::class)
internal data class ApiInstant(val value: String) {
    init {
        require(
            value.matches(
                Regex(
                    "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})",
                ),
            ),
        )
        require(runCatching { OffsetDateTime.parse(value) }.isSuccess)
    }

    val instant: Instant get() = OffsetDateTime.parse(value).toInstant()
}

internal object InstantSerializer : WireStringSerializer<ApiInstant>("ApiInstant") {
    override fun parse(value: String): ApiInstant = ApiInstant(value)
    override fun format(value: ApiInstant): String = value.value
}

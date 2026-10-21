package dev.groupplanning.android.data.api.models

import java.util.UUID

internal object UuidSerializer : WireStringSerializer<UUID>("UUID") {
    override fun parse(value: String): UUID {
        val parsed = UUID.fromString(value)
        require(parsed.toString().equals(value, ignoreCase = true))
        return parsed
    }

    override fun format(value: UUID): String = value.toString()
}

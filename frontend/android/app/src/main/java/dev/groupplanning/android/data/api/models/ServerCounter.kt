package dev.groupplanning.android.data.api.models

import kotlinx.serialization.Serializable

@Serializable(with = CounterSerializer::class)
internal data class ServerCounter(val value: String) : Comparable<ServerCounter> {
    init {
        require(value.matches(Regex("0|[1-9][0-9]*")))
    }

    override fun compareTo(other: ServerCounter): Int =
        compareValuesBy(this, other, { it.value.length }, { it.value })

    companion object {
        val Zero = ServerCounter("0")
    }
}

internal object CounterSerializer : WireStringSerializer<ServerCounter>("ServerCounter") {
    override fun parse(value: String): ServerCounter = ServerCounter(value)
    override fun format(value: ServerCounter): String = value.value
}

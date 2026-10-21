package dev.groupplanning.android.data.api.models

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

internal sealed interface FieldChange<out T> {
    data object Unchanged : FieldChange<Nothing>
    data object Clear : FieldChange<Nothing>
    data class Value<T>(val value: T) : FieldChange<T>
}

internal data class UpdateMeeting(
    val expectedRevision: ServerCounter,
    val title: String? = null,
    val description: FieldChange<String> = FieldChange.Unchanged,
    val startsAt: ApiInstant? = null,
    val timezone: String? = null,
    val place: FieldChange<String> = FieldChange.Unchanged,
) {
    fun json(): JsonObject = buildJsonObject {
        put("expected_revision", expectedRevision.value)
        title?.let { put("title", it) }
        startsAt?.let { put("starts_at", it.value) }
        timezone?.let { put("timezone", it) }
        description.jsonValue()?.let { put("description", it) }
        place.jsonValue()?.let { put("place", it) }
    }
}

private fun FieldChange<String>.jsonValue(): JsonElement? = when (this) {
    FieldChange.Unchanged -> null
    FieldChange.Clear -> JsonNull
    is FieldChange.Value -> JsonPrimitive(value)
}

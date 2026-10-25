package dev.groupplanning.android.data.api.models

import dev.groupplanning.android.data.api.apiJson
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.put

internal sealed interface FieldChange<out T> {
    data object Unchanged : FieldChange<Nothing>
    data object Clear : FieldChange<Nothing>
    data class Value<T>(val value: T) : FieldChange<T>
}

internal data class UpdateMeeting(
    val expectedRevision: ServerCounter,
    val title: String? = null,
    val cover: FieldChange<PreparedCover> = FieldChange.Unchanged,
    val description: FieldChange<String> = FieldChange.Unchanged,
    val startsAt: FieldChange<ApiInstant> = FieldChange.Unchanged,
    val startsOn: String? = null,
    val timezone: String? = null,
    val place: FieldChange<String> = FieldChange.Unchanged,
) {
    fun json(): JsonObject = buildJsonObject {
        put("expected_revision", expectedRevision.value)
        title?.let { put("title", it) }
        when (cover) {
            FieldChange.Unchanged -> Unit
            FieldChange.Clear -> put("cover", JsonNull)
            is FieldChange.Value -> put("cover", apiJson.encodeToJsonElement(cover.value))
        }
        when (startsAt) {
            FieldChange.Unchanged -> Unit
            FieldChange.Clear -> put("starts_at", JsonNull)
            is FieldChange.Value -> put("starts_at", startsAt.value.value)
        }
        startsOn?.let { put("starts_on", it) }
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

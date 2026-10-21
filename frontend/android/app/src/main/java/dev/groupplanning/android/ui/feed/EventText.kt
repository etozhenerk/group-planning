package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.components.meetingTime
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun eventText(entry: FeedEntry): String {
    if (entry.payloadVersion != 1) return stringResource(R.string.feed_unknown)
    val name = entry.actor.displayName
    return when (entry.kind) {
        "meeting_created" -> stringResource(R.string.feed_created, name)
        "participant_joined" -> stringResource(R.string.feed_joined, name)
        "participant_left", "rsvp_changed" -> {
            val answer = when (entry.payload.text("answer")) {
                "going" -> R.string.rsvp_going
                "maybe" -> R.string.rsvp_maybe
                "not_going" -> R.string.rsvp_not_going
                else -> return stringResource(R.string.feed_unknown)
            }
            stringResource(R.string.feed_answered, name, stringResource(answer))
        }
        "meeting_updated" -> {
            val headline = stringResource(R.string.feed_updated, name)
            val previous = entry.payload["previous"] as? JsonObject
            val current = entry.payload["current"] as? JsonObject
            if (previous == null || current == null) return headline
            val labels = listOf(
                "title" to R.string.field_title,
                "description" to R.string.field_description,
                "starts_at" to R.string.field_datetime,
                "timezone" to R.string.field_timezone,
                "place" to R.string.field_place,
            )
            val changes = labels.filter { (key, _) ->
                previous[key] != current[key]
            }.map { (key, label) ->
                var value = current.text(key)
                if (key == "starts_at" && value != null) {
                    value =
                        runCatching {
                            meetingTime(
                                ApiInstant(value),
                                current.text("timezone") ?: "UTC",
                            )
                        }.getOrNull()
                }
                stringResource(
                    R.string.feed_change,
                    stringResource(label),
                    value ?: stringResource(R.string.feed_removed),
                )
            }
            (listOf(headline) + changes).joinToString("\n")
        }
        else -> stringResource(R.string.feed_unknown)
    }
}

private fun JsonObject.text(key: String): String? = (get(key) as? JsonPrimitive)?.takeIf {
    it.isString
}?.content

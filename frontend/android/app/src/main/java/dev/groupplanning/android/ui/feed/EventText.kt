package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.datepoll.pollDayLabel
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun eventText(entry: FeedEntry): String {
    if (entry.payloadVersion != 1) return stringResource(R.string.feed_unknown)
    val name = entry.actor.displayName
    return when (entry.kind) {
        "meeting_time_unspecified" -> stringResource(R.string.feed_time_unspecified)
        "place_poll_cancelled" -> stringResource(R.string.place_poll_cancelled)
        "place_poll_result" -> {
            val state = (entry.payload["state"] as? JsonPrimitive)?.content
            stringResource(
                when (state) {
                    "applied" -> R.string.place_poll_result
                    "rejected" -> R.string.place_poll_unchanged_result
                    else -> R.string.feed_unknown
                },
            )
        }
        "date_poll_no_majority" -> stringResource(R.string.feed_poll_no_majority)
        "date_poll_choice_required" -> stringResource(R.string.feed_poll_choice)
        "date_poll_time_required" -> stringResource(R.string.feed_poll_time)
        "date_poll_cancelled" -> stringResource(R.string.feed_poll_cancelled)
        "date_poll_applied" -> {
            val current = entry.payload["current"] as? JsonObject
            val previous = entry.payload["previous"] as? JsonObject
            val day = current?.text("starts_on") ?: return stringResource(R.string.feed_unknown)
            stringResource(
                if (previous?.text("starts_on") == day) {
                    R.string.feed_poll_confirmed
                } else {
                    R.string.feed_poll_applied
                },
                pollDayLabel(day),
            )
        }
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
                previous[key] != current[key] ||
                    key == "starts_at" &&
                    previous["starts_on"] != current["starts_on"]
            }.map { (key, label) ->
                var value = current.text(key)
                if (key == "starts_at") {
                    val instant = value?.let { runCatching { ApiInstant(it) }.getOrNull() }
                    value =
                        meetingTime(
                            instant,
                            current.text("timezone") ?: "UTC",
                            current.text("starts_on"),
                        )
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

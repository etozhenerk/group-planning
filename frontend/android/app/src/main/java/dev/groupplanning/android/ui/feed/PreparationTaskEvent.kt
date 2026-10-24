package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun preparationTaskEvent(entry: FeedEntry): String? {
    val label = when (entry.kind) {
        "preparation_task_created" -> R.string.preparation_event_created
        "preparation_task_accepted" -> R.string.preparation_event_accepted
        "preparation_task_declined" -> R.string.preparation_event_declined
        "preparation_task_cancelled" -> R.string.preparation_event_cancelled
        "preparation_task_completed" -> R.string.preparation_event_completed
        else -> return null
    }
    val title =
        (entry.payload["title"] as? JsonPrimitive)?.takeIf { it.isString }?.content ?: return null
    return stringResource(label, entry.actor.displayName, title)
}

package dev.groupplanning.android.ui.datepoll

import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.ui.meetingform.MeetingTimeDialog
import java.util.UUID
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

@Composable
internal fun DatePollResolution(
    poll: DatePoll,
    zone: String,
    enabled: Boolean,
    resolve: (UUID, JsonElement?) -> Unit,
) {
    var time by rememberSaveable { mutableStateOf<String?>(null) }
    var repetition by rememberSaveable { mutableStateOf<Repetition?>(null) }
    var problem by rememberSaveable { mutableStateOf<String?>(null) }
    var picking by rememberSaveable { mutableStateOf(false) }
    val options = poll.options.filter { it.id in poll.leaderOptionIds }
    if (poll.state == "awaiting_choice") {
        Text(stringResource(R.string.poll_choose_leader))
        options.forEach { option ->
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    resolve(option.id, null)
                },
                modifier = Modifier.testTag("poll-resolve-${option.date}"),
                enabled = enabled,
            ) {
                Text(pollDayLabel(option.date))
            }
        }
    } else if (poll.state == "awaiting_time") {
        val option = options.firstOrNull() ?: return
        val draft =
            MeetingDraft(
                zone,
                title = "Встреча",
                day = option.date,
                time = time,
                repetition = repetition,
            )
        Text(stringResource(R.string.poll_time_explanation))
        TextButton(
            colors = ButtonDefaults.textButtonColors(
                contentColor = LocalContentColor.current,
            ),
            onClick = {
                picking =
                    true
            },
            enabled = enabled,
        ) {
            Text(
                time ?: stringResource(R.string.poll_choose_time),
            )
        }
        if (problem == DraftIssue.Ambiguous.text) {
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    repetition = Repetition.Earlier
                },
                enabled = enabled,
            ) { Text(stringResource(R.string.poll_time_earlier)) }
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    repetition = Repetition.Later
                },
                enabled = enabled,
            ) { Text(stringResource(R.string.poll_time_later)) }
        }
        problem?.let { Text(it) }
        TextButton(
            colors = ButtonDefaults.textButtonColors(
                contentColor = LocalContentColor.current,
            ),
            onClick = {
                val value = draft.validate()
                problem = value.issue?.text
                value.input?.startsAt?.let { resolve(option.id, JsonPrimitive(it.value)) }
            },
            enabled = enabled && time != null,
        ) { Text(stringResource(R.string.poll_save_time)) }
        TextButton(
            colors = ButtonDefaults.textButtonColors(
                contentColor = LocalContentColor.current,
            ),
            onClick = {
                resolve(option.id, JsonNull)
            },
            enabled = enabled,
        ) { Text(stringResource(R.string.poll_without_time)) }
        if (picking) {
            MeetingTimeDialog(draft, { picking = false }) {
                time = it
                repetition = null
                problem = null
                picking = false
            }
        }
    }
}

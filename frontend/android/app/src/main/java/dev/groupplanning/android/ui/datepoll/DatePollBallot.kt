package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.components.ActionButton
import java.time.LocalDate

@Composable
internal fun DatePollBallot(state: DatePollState, actions: DatePollActions) {
    val poll = state.poll ?: return
    var adding by rememberSaveable { mutableStateOf(false) }
    var day by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    poll.options.forEach { option ->
        Column(
            Modifier.fillMaxWidth().testTag(
                "poll-option-${option.date}",
            ).defaultMinSize(minHeight = 48.dp).toggleable(
                value = option.id in state.selected,
                enabled = poll.canVote && state.editable,
                role = Role.Checkbox,
                onValueChange = { actions.choose(option.id) },
            ),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(option.id in state.selected, onCheckedChange = null)
                Text(pollDayLabel(option.date), Modifier.weight(1f))
                option.votes?.let { Text(pluralStringResource(R.plurals.poll_votes, it, it)) }
            }
            option.voters?.takeIf {
                it.isNotEmpty()
            }?.let { Text(it.joinToString(", ") { voter -> voter.displayName }) }
            if (poll.appliedOptionId == option.id) Text(stringResource(R.string.poll_selected))
        }
    }
    if (poll.canVote) {
        ActionButton(
            stringResource(R.string.poll_vote),
            enabled =
            state.editable && state.selected.isNotEmpty(),
            busy = state.busy,
        ) { actions.vote(false) }
        if (poll.myOptionIds.isNotEmpty()) {
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    actions.vote(true)
                },
                enabled = state.editable,
            ) { Text(stringResource(R.string.poll_remove_vote)) }
        }
    }
    if (poll.canAddOptions) {
        if (adding) {
            DatePollDayField(stringResource(R.string.poll_new_date), day, state.editable) {
                day = it
            }
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    actions.add(day)
                },
                enabled = state.editable,
            ) { Text(stringResource(R.string.poll_add)) }
        } else {
            TextButton(
                colors = ButtonDefaults.textButtonColors(
                    contentColor = LocalContentColor.current,
                ),
                onClick = {
                    adding = true
                },
                enabled = state.editable,
            ) { Text(stringResource(R.string.poll_add_date)) }
        }
    }
}

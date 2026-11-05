package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.DecisionActionButton
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.LocalDate

@Composable
internal fun DatePollBallot(state: DatePollState, actions: DatePollActions) {
    val poll = state.poll ?: return
    var adding by rememberSaveable { mutableStateOf(false) }
    var day by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    poll.options.forEach { option ->
        DatePollOptionRow(
            option,
            poll,
            option.id in state.selected || poll.appliedOptionId == option.id,
            poll.canVote && state.editable,
        ) { actions.choose(option.id) }
    }
    if (poll.canVote) {
        DecisionActionButton(
            stringResource(
                if (poll.myOptionIds.isEmpty()) R.string.poll_vote else R.string.poll_change_vote,
            ),
            enabled =
            state.editable &&
                state.selected.isNotEmpty() &&
                state.selected != poll.myOptionIds.toSet(),
            busy = state.busy,
            modifier = Modifier.padding(top = DesignTokens.spaceS16),
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
                colors = ButtonDefaults.textButtonColors(contentColor = DesignTokens.colorAccent),
                contentPadding = PaddingValues(DesignTokens.spaceS0),
                onClick = { adding = true },
                enabled = state.editable,
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(
                        ChatSymbol.Plus,
                        Modifier.size(DesignTokens.componentMobileFieldIconSize),
                        tint = DesignTokens.colorAccent,
                    )
                    Text(
                        stringResource(R.string.poll_propose_date),
                        fontSize = DesignTokens.typographySizeBody,
                        fontWeight = FontWeight.Normal,
                    )
                }
            }
        }
    }
}

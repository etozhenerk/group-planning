package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState

@Composable
internal fun PreparationTaskActions(state: PreparationTaskState, act: (PreparationAction) -> Unit) {
    val task = state.task ?: return
    val busyLabel = stringResource(R.string.action_busy)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(
            PreparationAction.Accept,
            PreparationAction.Complete,
            PreparationAction.Decline,
            PreparationAction.Cancel,
        ).filter {
            it.allowed(task)
        }.forEach { action ->
            val label = preparationActionLabel(action, task)
            val sending = state.busy && state.sendingAction == action
            OutlinedButton(
                {
                    act(action)
                },
                enabled = state.editable,
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = LocalContentColor.current,
                    disabledContentColor = LocalContentColor.current.copy(alpha = .5f),
                ),
                modifier = Modifier.fillMaxWidth().testTag("preparation-${action.path}").semantics {
                    contentDescription = label
                    stateDescription = if (sending) busyLabel else ""
                },
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(label, Modifier.alpha(if (sending) 0f else 1f))
                    if (sending) {
                        CircularProgressIndicator(
                            Modifier.size(20.dp),
                            color = LocalContentColor.current,
                            strokeWidth = 2.dp,
                        )
                    }
                }
            }
        }
    }
}

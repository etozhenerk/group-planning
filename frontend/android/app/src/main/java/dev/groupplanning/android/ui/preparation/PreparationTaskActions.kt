package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PreparationTaskActions(
    state: PreparationTaskState,
    act: (PreparationAction) -> Unit,
    inline: Boolean = false,
) {
    val task = state.task ?: return
    Column(
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentTaskDetailsActionsGap),
    ) {
        listOf(
            PreparationAction.Accept,
            PreparationAction.Complete,
            PreparationAction.Decline,
            PreparationAction.Cancel,
        ).filter {
            it.allowed(task) &&
                (!inline || it == PreparationAction.Accept || it == PreparationAction.Complete)
        }.forEach { action ->
            val busy = state.busy && state.sendingAction == action
            if (inline) {
                PreparationInlineAction(
                    if (action == PreparationAction.Accept) {
                        stringResource(R.string.preparation_take)
                    } else {
                        preparationActionLabel(action, task)
                    },
                    state.editable,
                    busy,
                    Modifier.testTag("preparation-inline-${action.path}"),
                ) { act(action) }
            } else {
                CompactButton(
                    preparationActionLabel(action, task),
                    Modifier.fillMaxWidth().testTag("preparation-${action.path}"),
                    primary = action == PreparationAction.Accept ||
                        action == PreparationAction.Complete,
                    enabled = state.editable,
                    busy = busy,
                ) { act(action) }
            }
        }
    }
}

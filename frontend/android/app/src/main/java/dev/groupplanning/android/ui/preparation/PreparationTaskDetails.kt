package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationTaskDetails(state: PreparationTaskState, user: UUID, retry: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().testTag("preparation-task-${state.task?.id}"),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentTaskDetailsFactsGap),
    ) {
        val task = state.task
        if (task != null) {
            Text(
                preparationStatus(task, user),
                color = DesignTokens.colorAccent,
                fontSize = DesignTokens.typographySizeCaption,
            )
            HorizontalDivider(color = DesignTokens.colorLine)
            val facts = listOfNotNull(
                R.string.task_author to task.author.displayName,
                task.recipient?.let { R.string.task_recipient to it.displayName },
                task.assignee?.let { R.string.task_assignee to it.displayName },
            )
            facts.forEach { (label, name) ->
                Row(
                    Modifier.fillMaxWidth().padding(
                        vertical = DesignTokens.componentTaskDetailsFactInsetBlock,
                    ),
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.componentTaskDetailsFactsGap,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        stringResource(label),
                        Modifier.weight(1f),
                        color = DesignTokens.colorMuted,
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                    Text(name, Modifier.weight(1f), fontSize = DesignTokens.typographySizeSmall)
                }
            }
        } else if (state.issue == null) {
            PreparationTaskLoading()
        }
        state.issue?.let {
            Text(
                preparationIssueText(it),
                Modifier.testTag("preparation-error"),
                color = DesignTokens.colorError,
            )
            TextButton(
                retry,
                enabled = !state.busy,
                modifier = Modifier.testTag("preparation-retry"),
            ) {
                Text(stringResource(R.string.poll_retry))
            }
        }
    }
}

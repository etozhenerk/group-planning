package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.ChatCardEyebrow
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatInlineCard
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationTaskCard(
    state: PreparationTaskState,
    entry: FeedEntry,
    user: UUID,
    act: (PreparationAction) -> Unit,
    retry: () -> Unit,
) {
    var details by rememberSaveable(entry.id.toString()) { mutableStateOf(false) }
    var confirmation by rememberSaveable(entry.id.toString()) {
        mutableStateOf<PreparationAction?>(null)
    }
    val task = state.task
    ChatInlineCard {
        ChatCardEyebrow(entry, ChatSymbol.Task, task = true)
        if (task != null) {
            Row(
                Modifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid)
                    .clickable { details = true }
                    .testTag("preparation-summary-${task.id}"),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    task.title,
                    Modifier.weight(1f),
                    fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
                    fontSize = DesignTokens.typographySizeBody,
                    lineHeight =
                    DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
                )
                ChatIcon(
                    ChatSymbol.Right,
                    Modifier.size(DesignTokens.componentMobileChatInlineTaskChevron),
                )
            }
            Text(
                preparationStatus(task, user),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight =
                DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightLabel,
            )
            PreparationTaskActions(state, act, inline = true)
        } else if (state.issue == null) {
            PreparationTaskLoading()
        }
        if (!details) {
            state.issue?.let {
                Text(
                    preparationIssueText(it),
                    Modifier.testTag("preparation-inline-error"),
                    color = DesignTokens.colorError,
                )
                TextButton(retry, enabled = !state.busy) {
                    Text(stringResource(R.string.poll_retry))
                }
            }
        }
    }
    if (details) {
        val pendingConfirmation = confirmation
        ActionSheet(
            title = when (pendingConfirmation) {
                PreparationAction.Cancel -> stringResource(R.string.task_cancel_confirm)
                PreparationAction.Decline -> stringResource(R.string.task_decline_confirm)
                else -> task?.title ?: stringResource(R.string.preparation_details)
            },
            close = { if (confirmation != null) confirmation = null else details = false },
            canClose = !state.busy,
            actions = {
                if (pendingConfirmation != null && task != null) {
                    CompactButton(
                        preparationActionLabel(pendingConfirmation, task),
                        Modifier.fillMaxWidth().testTag("preparation-confirm"),
                        primary = true,
                        enabled = state.editable,
                    ) {
                        confirmation = null
                        act(pendingConfirmation)
                    }
                    TextButton({ confirmation = null }) { Text(stringResource(R.string.task_keep)) }
                } else {
                    PreparationTaskActions(state, { action ->
                        if (action == PreparationAction.Cancel ||
                            action == PreparationAction.Decline
                        ) {
                            confirmation = action
                        } else {
                            act(action)
                        }
                    })
                }
            },
        ) {
            if (pendingConfirmation != null) {
                Text(
                    stringResource(
                        if (pendingConfirmation ==
                            PreparationAction.Cancel
                        ) {
                            R.string.task_cancel_explanation
                        } else {
                            R.string.task_decline_explanation
                        },
                    ),
                )
            } else {
                PreparationTaskDetails(state, user, retry)
            }
        }
    }
}

package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.FormSubmissionNotice
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationTaskPanel(
    state: PreparationTaskState,
    user: UUID,
    act: (PreparationAction) -> Unit,
    retry: () -> Unit,
    close: () -> Unit,
) {
    var confirmation by rememberSaveable { mutableStateOf<PreparationAction?>(null) }
    val task = state.task
    val action = confirmation
    val hasActions =
        task?.let { it.canAccept || it.canComplete || it.canDecline || it.canCancel } == true
    val showFooter = action != null || hasActions || state.issue != null
    ActionSheet(
        title = when (action) {
            PreparationAction.Cancel -> stringResource(R.string.task_cancel_confirm)
            PreparationAction.Decline -> stringResource(R.string.task_decline_confirm)
            else ->
                task?.title
                    ?: stringResource(R.string.preparation_details)
        },
        close = {
            if (confirmation !=
                null
            ) {
                confirmation = null
            } else {
                close()
            }
        },
        canClose =
        !state.busy && state.pending == null,
        canDismiss = false,
        stickyActions = true,
        actions = if (showFooter) {
            {
                state.issue?.let {
                    FormSubmissionNotice(
                        preparationIssueText(it),
                        stringResource(R.string.poll_create_unknown_body),
                    )
                    CompactButton(
                        stringResource(R.string.poll_retry),
                        enabled = !state.busy,
                        click = retry,
                    )
                }
                if (action != null && task != null) {
                    CompactButton(
                        if (action ==
                            PreparationAction.Decline
                        ) {
                            stringResource(R.string.prep_decline_short)
                        } else {
                            preparationActionLabel(action, task)
                        },
                        Modifier.fillMaxWidth().testTag("preparation-confirm"),
                        primary = true,
                        enabled = state.editable,
                        cornerRadius = DesignTokens.componentMobilePreparationFormActionRadius,
                    ) {
                        confirmation =
                            null
                        act(action)
                    }
                    TextButton({
                        confirmation = null
                    }, modifier = Modifier.fillMaxWidth()) {
                        Text(
                            stringResource(R.string.task_keep),
                            color = DesignTokens.colorMuted,
                            fontSize = DesignTokens.typographySizeSmall,
                        )
                    }
                } else {
                    PreparationTaskActions(state, { next ->
                        if (next == PreparationAction.Cancel ||
                            next == PreparationAction.Decline
                        ) {
                            confirmation = next
                        } else {
                            act(next)
                        }
                    })
                }
            }
        } else {
            null
        },
    ) {
        if (action != null && task != null) {
            Text(
                task.title,
                fontSize = DesignTokens.typographySizeButton,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                stringResource(
                    if (action ==
                        PreparationAction.Cancel
                    ) {
                        R.string.task_cancel_explanation
                    } else {
                        R.string.task_decline_explanation
                    },
                ),
                fontSize = DesignTokens.typographySizeSmall,
                color = DesignTokens.colorMuted,
            )
        } else {
            PreparationTaskDetails(state, user)
        }
    }
}

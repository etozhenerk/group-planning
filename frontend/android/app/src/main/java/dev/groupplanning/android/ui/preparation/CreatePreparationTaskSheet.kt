package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.FormSubmissionNotice
import dev.groupplanning.android.ui.components.RequiredMark
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreatePreparationTaskSheet(model: PreparationFormViewModel, close: () -> Unit) {
    val form by model.state.collectAsStateWithLifecycle()
    val state by model.operation.state.collectAsStateWithLifecycle()
    var confirm by remember(model) { mutableStateOf(false) }
    var selecting by remember(model) { mutableStateOf(false) }
    val blocked = state.busy || state.pending != null
    val requestClose = {
        if (!blocked) {
            when {
                selecting -> selecting = false
                confirm -> confirm = false
                model.dirty -> confirm = true
                else -> close()
            }
        }
    }
    LaunchedEffect(model) { model.loadPeople() }
    LaunchedEffect(state.task?.id, state.busy) { if (state.task != null && !state.busy) close() }
    ActionSheet(
        stringResource(
            if (confirm) {
                R.string.poll_discard_title
            } else if (selecting) {
                R.string.preparation_recipient
            } else {
                R.string.preparation_propose
            },
        ),
        requestClose,
        canClose = !blocked,
        canDismiss = false,
    ) {
        if (confirm) {
            Text(stringResource(R.string.prep_dirty), color = DesignTokens.colorMuted)
            CompactButton(
                stringResource(
                    R.string.keep_editing,
                ),
                Modifier.fillMaxWidth(),
                primary = true,
                click = {
                    confirm =
                        false
                },
            )
            CompactButton(
                stringResource(R.string.discard_settings),
                Modifier.fillMaxWidth(),
                click = close,
            )
        } else if (selecting) {
            PreparationRecipientSearch(form.participants.orEmpty(), model.userId, form.recipient) {
                model.recipient(it)
                selecting =
                    false
            }
        } else {
            Row(
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(
                    DesignTokens.spaceS4,
                ),
            ) {
                RequiredMark()
                Text(
                    stringResource(R.string.prep_required),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
            }
            PreparationTitleField(form, state.editable, model::title)
            PreparationRecipientField(form, model.userId, state.editable, {
                selecting = true
            }, model::reloadPeople)
            Text(
                stringResource(R.string.prep_note),
                fontSize = DesignTokens.typographySizeCaption,
                color = DesignTokens.colorMuted,
            )
            state.issue?.let {
                FormSubmissionNotice(
                    if (state.pending !=
                        null
                    ) {
                        stringResource(R.string.prep_unknown)
                    } else {
                        preparationIssueText(it, creating = true)
                    },
                    stringResource(
                        if (state.pending !=
                            null
                        ) {
                            R.string.poll_create_unknown_body
                        } else {
                            R.string.prep_error_body
                        },
                    ),
                )
            }
            CompactButton(
                stringResource(
                    if (state.pending !=
                        null
                    ) {
                        R.string.poll_retry_send
                    } else if (state.issue !=
                        null
                    ) {
                        R.string.poll_create_retry
                    } else {
                        R.string.preparation_propose
                    },
                ),
                Modifier.fillMaxWidth().testTag("preparation-create"),
                busy = state.busy,
                cornerRadius = DesignTokens.componentMobilePreparationFormActionRadius,
                enabled = state.pending != null || (form.participants != null && !form.peopleError),
                primary = true,
                click = model::create,
            )
        }
    }
}

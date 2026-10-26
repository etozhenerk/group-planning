package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormIssue
import dev.groupplanning.android.state.preparation.PreparationFormViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.DesignField
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CreatePreparationTaskSheet(model: PreparationFormViewModel, close: () -> Unit) {
    val form by model.state.collectAsStateWithLifecycle()
    val state by model.operation.state.collectAsStateWithLifecycle()
    LaunchedEffect(model) { model.loadPeople() }
    LaunchedEffect(state.task?.id, state.busy) {
        if (state.task != null && !state.busy) close()
    }
    ActionSheet(stringResource(R.string.preparation_propose), close, canClose = !state.busy) {
        DesignField(
            form.title,
            model::title,
            label = stringResource(R.string.preparation_title),
            placeholder = stringResource(R.string.preparation_title_placeholder),
            enabled = state.editable,
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag(
                "preparation-title",
            ),
        )
        PreparationRecipientField(
            form,
            model.userId,
            state.editable,
            model::recipient,
            model::reloadPeople,
        )

        state.issue?.let {
            Text(
                preparationIssueText(it, creating = true),
                color = Palette.error,
                modifier = Modifier.testTag("preparation-error"),
            )
        }
        form.validation?.let {
            Text(
                stringResource(
                    if (it ==
                        PreparationFormIssue.Title
                    ) {
                        R.string.preparation_title_invalid
                    } else {
                        R.string.preparation_recipient_invalid
                    },
                ),
                color = Palette.error,
            )
        }
        CompactButton(
            stringResource(
                if (state.pending ==
                    null
                ) {
                    R.string.preparation_propose
                } else {
                    R.string.poll_retry
                },
            ),
            modifier = Modifier.fillMaxWidth().testTag("preparation-create"),
            busy = state.busy,
            enabled =
            state.pending != null || (form.participants != null && !form.peopleError),
            primary = true,
            click = model::create,
        )
    }
}

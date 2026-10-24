package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormIssue
import dev.groupplanning.android.state.preparation.PreparationFormViewModel
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.theme.Palette

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CreatePreparationTaskSheet(model: PreparationFormViewModel, close: () -> Unit) {
    val form by model.state.collectAsStateWithLifecycle()
    val state by model.operation.state.collectAsStateWithLifecycle()
    val sheet =
        rememberModalBottomSheetState(skipPartiallyExpanded = true, confirmValueChange = {
            state.pending ==
                null
        })
    LaunchedEffect(model) { model.loadPeople() }
    LaunchedEffect(state.task?.id) { if (state.task != null) close() }
    ModalBottomSheet(onDismissRequest = {
        if (state.pending ==
            null
        ) {
            close()
        }
    }, sheetState = sheet) {
        Column(Modifier.imePadding()) {
            Column(
                Modifier.weight(
                    1f,
                    fill = false,
                ).verticalScroll(rememberScrollState()).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    stringResource(R.string.preparation_propose),
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                )
                OutlinedTextField(
                    form.title,
                    model::title,
                    label = {
                        Text(stringResource(R.string.preparation_title))
                    },
                    enabled = state.editable,
                    minLines = 2,
                    maxLines = 5,
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
            }
            Column(
                Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
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
                ActionButton(
                    stringResource(
                        if (state.pending ==
                            null
                        ) {
                            R.string.preparation_propose
                        } else {
                            R.string.poll_retry
                        },
                    ),
                    modifier = Modifier.testTag("preparation-create"),
                    busy = state.busy,
                    enabled =
                    state.pending != null || (form.participants != null && !form.peopleError),
                    onClick = model::create,
                )
                TextButton(close, enabled = state.pending == null) {
                    Text(stringResource(R.string.poll_cancel))
                }
            }
        }
    }
}

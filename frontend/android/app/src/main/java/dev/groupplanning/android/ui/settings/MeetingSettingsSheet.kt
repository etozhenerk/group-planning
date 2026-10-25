package dev.groupplanning.android.ui.settings

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.state.settings.SettingsViewModel
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.covers.CoverEditor
import dev.groupplanning.android.ui.meetingform.MeetingFields
import dev.groupplanning.android.ui.theme.Palette

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MeetingSettingsSheet(model: SettingsViewModel, close: () -> Unit, saved: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    var confirm by remember { mutableStateOf(false) }
    val requestClose = {
        if (!state.busy && !state.preparingCover) {
            if (state.dirty) confirm = true else close()
        }
    }
    LaunchedEffect(state.saved) { if (state.saved) saved() }
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true, confirmValueChange = {
        if (it == SheetValue.Hidden && (state.dirty || state.busy || state.preparingCover)) {
            requestClose()
            false
        } else {
            true
        }
    })
    ModalBottomSheet(requestClose, sheetState = sheet, containerColor = Palette.background) {
        BackHandler { requestClose() }
        Column(
            Modifier.imePadding().verticalScroll(rememberScrollState()).padding(24.dp)
                .testTag("meeting-settings"),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Text(
                stringResource(R.string.meeting_settings),
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
            )
            MeetingFields(
                state.draft,
                state.editable,
                state.validation == DraftIssue.Ambiguous,
                model::change,
            )
            CoverEditor(state.draft.cover, state.editable, model::preparingCover, { cover ->
                model.change { it.copy(cover = cover) }
            }, original = state.original.coverUrl, meetingId = state.original.id)
            state.validation?.let { Text(it.text, color = Palette.error) }
            state.issue?.let { SettingsProblem(it, state.busy, model::reload) }
            ActionButton(
                stringResource(
                    if (state.pending != null) {
                        R.string.settings_retry
                    } else {
                        R.string.save_settings
                    },
                ),
                Modifier.testTag("settings-save"),
                enabled = state.dirty &&
                    !state.busy &&
                    !state.preparingCover &&
                    state.issue != SettingsIssue.Conflict &&
                    state.issue != SettingsIssue.Forbidden,
                busy = state.busy,
                onClick = model::save,
            )
            TextButton(requestClose) { Text(stringResource(R.string.cancel_settings)) }
        }
    }
    if (confirm) {
        AlertDialog(
            { confirm = false },
            title = { Text(stringResource(R.string.discard_settings_title)) },
            text = { Text(stringResource(R.string.discard_settings_body)) },
            confirmButton = {
                TextButton({
                    confirm = false
                    close()
                }) {
                    Text(stringResource(R.string.discard_settings))
                }
            },
            dismissButton = {
                TextButton({ confirm = false }) { Text(stringResource(R.string.keep_editing)) }
            },
        )
    }
}

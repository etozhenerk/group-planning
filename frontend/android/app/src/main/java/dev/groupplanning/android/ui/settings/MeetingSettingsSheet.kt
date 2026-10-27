package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.state.settings.SettingsViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.covers.CoverEditor
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingSettingsSheet(
    model: SettingsViewModel?,
    close: () -> Unit,
    saved: () -> Unit,
    parentTitle: String,
    parentContent: @Composable ColumnScope.() -> Unit,
) {
    val state = model?.state?.collectAsStateWithLifecycle()?.value
    var confirm by remember(model) { mutableStateOf(false) }
    val canClose = state?.busy != true && state?.preparingCover != true
    val requestClose = {
        if (canClose) {
            if (confirm) {
                confirm = false
            } else if (state?.dirty == true) {
                confirm = true
            } else {
                close()
            }
        }
    }
    LaunchedEffect(state?.saved) { if (state?.saved == true) saved() }
    val title = when {
        confirm -> stringResource(R.string.discard_settings_title)
        model != null -> stringResource(R.string.meeting_settings)
        else -> parentTitle
    }
    ActionSheet(
        title,
        requestClose,
        Modifier.testTag(if (model == null) "meeting-information" else "meeting-settings"),
        canClose = canClose,
        canDismiss = canClose && state?.dirty != true && !confirm,
        actions = if (model != null && state != null) {
            {
                if (confirm) {
                    CompactButton(
                        stringResource(R.string.discard_settings),
                        Modifier.fillMaxWidth(),
                        primary = true,
                    ) {
                        confirm = false
                        close()
                    }
                    TextButton({ confirm = false }) { Text(stringResource(R.string.keep_editing)) }
                } else {
                    CompactButton(
                        stringResource(
                            if (state.pending !=
                                null
                            ) {
                                R.string.settings_retry
                            } else {
                                R.string.save_settings
                            },
                        ),
                        Modifier.fillMaxWidth().testTag("settings-save"),
                        primary = true,
                        enabled = state.dirty &&
                            canClose &&
                            state.issue != SettingsIssue.Conflict &&
                            state.issue != SettingsIssue.Forbidden,
                        busy = state.busy,
                        click = model::save,
                    )
                }
            }
        } else {
            null
        },
    ) {
        if (confirm) {
            Text(stringResource(R.string.discard_settings_body))
        } else if (state != null) {
            MeetingSettingsFields(
                state.draft,
                state.editable,
                state.validation == DraftIssue.Ambiguous,
                model::change,
            )
            Column {
                HorizontalDivider(color = DesignTokens.colorLine)
                CoverEditor(
                    state.draft.cover,
                    state.editable,
                    model::preparingCover,
                    { cover -> model.change { it.copy(cover = cover) } },
                    modifier = Modifier.padding(top = DesignTokens.spaceS16),
                    original = state.original.coverUrl,
                    meetingId = state.original.id,
                    compact = true,
                )
            }
            state.validation?.let { Text(it.text, color = DesignTokens.colorError) }
            state.issue?.let { SettingsProblem(it, state.busy, model::reload) }
        } else {
            parentContent()
        }
    }
}

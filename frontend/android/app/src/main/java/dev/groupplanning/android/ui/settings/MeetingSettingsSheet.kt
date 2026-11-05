package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.ColumnScope
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
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.state.settings.SettingsViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.covers.CoverEditor
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingSettingsSheet(
    model: SettingsViewModel?,
    close: () -> Unit,
    saved: () -> Unit,
    parentTitle: String,
    parentHasChild: Boolean = false,
    parentActions: (@Composable ColumnScope.() -> Unit)? = null,
    parentContent: @Composable ColumnScope.() -> Unit,
) {
    val state = model?.state?.collectAsStateWithLifecycle()?.value
    var confirm by remember(model) { mutableStateOf(false) }
    var reviewing by remember(model) { mutableStateOf(false) }
    val canClose = state?.busy != true && state?.preparingCover != true && state?.pending == null
    val requestClose = {
        if (canClose) {
            when {
                confirm -> confirm = false
                reviewing -> reviewing = false
                state?.dirty == true && state.issue != SettingsIssue.Forbidden -> confirm = true
                else -> close()
            }
        }
    }
    LaunchedEffect(state?.saved) { if (state?.saved == true) saved() }
    val title = when {
        confirm -> stringResource(R.string.discard_settings_title)
        reviewing -> stringResource(R.string.settings_check_changes)
        model != null -> stringResource(R.string.meeting_settings)
        else -> parentTitle
    }
    ActionSheet(
        title,
        requestClose,
        Modifier.testTag(if (model == null) "meeting-information" else "meeting-settings"),
        canClose = canClose,
        canDismiss =
        canClose && state?.dirty != true && !confirm && model == null && !parentHasChild,
        stickyActions = true,
        actions = if (model != null && state != null) {
            {
                SettingsActions(
                    state, confirm, reviewing,
                    stay = { confirm = false }, leave = {
                        confirm = false
                        close()
                    },
                    review = {
                        reviewing = true
                        model.reload()
                    },
                    resume = {
                        model.resumeConflict()
                        reviewing = false
                    },
                    reload = model::reload, save = model::save, back = close,
                )
            }
        } else {
            parentActions
        },
    ) {
        when {
            confirm -> Text(stringResource(R.string.discard_settings_body))
            state?.issue == SettingsIssue.Forbidden -> Text(
                stringResource(R.string.settings_forbidden),
            )
            state != null && reviewing -> SettingsConflictContent(state)
            state != null -> {
                CoverEditor(
                    state.draft.cover,
                    state.editable,
                    model::preparingCover,
                    { cover -> model.change { it.copy(cover = cover) } },
                    original = state.original.coverUrl,
                    meetingId = state.original.id,
                    optionalHint = false,
                )
                dev.groupplanning.android.ui.components.RequiredLegend(sentence = true)
                MeetingSettingsFields(
                    state.draft,
                    state.editable,
                    state.validation == DraftIssue.Ambiguous,
                    titleError = if (state.validation ==
                        DraftIssue.Title
                    ) {
                        state.validation.text
                    } else {
                        null
                    },
                    validationAttempt = state.validationAttempt,
                    change = model::change,
                )
                state.validation?.takeUnless {
                    it == DraftIssue.Title
                }?.let { Text(it.text, color = DesignTokens.colorError) }
            }
            else -> parentContent()
        }
    }
}

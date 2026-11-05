package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.state.settings.SettingsState
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.FormSubmissionNotice
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun SettingsActions(
    state: SettingsState,
    confirm: Boolean,
    reviewing: Boolean,
    stay: () -> Unit,
    leave: () -> Unit,
    review: () -> Unit,
    resume: () -> Unit,
    reload: () -> Unit,
    save: () -> Unit,
    back: () -> Unit,
) {
    when {
        confirm -> {
            CompactButton(
                stringResource(R.string.keep_editing),
                Modifier.fillMaxWidth(),
                primary = true,
                click = stay,
            )
            TextButton(leave) { Text(stringResource(R.string.discard_settings)) }
        }
        state.issue == SettingsIssue.Forbidden -> CompactButton(
            stringResource(R.string.settings_back_info),
            Modifier.fillMaxWidth(),
            primary = true,
            click = back,
        )
        reviewing -> {
            if (state.latest == null && !state.busy) {
                Text(stringResource(R.string.settings_load_error), color = DesignTokens.colorError)
                TextButton(reload) { Text(stringResource(R.string.info_retry)) }
            }
            CompactButton(
                stringResource(R.string.settings_resume_review),
                Modifier.fillMaxWidth(),
                primary = true,
                enabled =
                state.latest != null,
                busy = state.busy,
                click = resume,
            )
        }
        state.issue == SettingsIssue.Conflict -> {
            FormSubmissionNotice(
                stringResource(R.string.settings_changed_title),
                stringResource(R.string.settings_changed_hint),
            )
            CompactButton(
                stringResource(R.string.settings_check_changes),
                Modifier.fillMaxWidth().testTag("settings-reload"),
                primary = true,
                click = review,
            )
        }
        else -> {
            state.issue?.let {
                FormSubmissionNotice(
                    stringResource(
                        if (it ==
                            SettingsIssue.Unconfirmed
                        ) {
                            R.string.settings_unknown_title
                        } else {
                            R.string.settings_failed_title
                        },
                    ),
                    stringResource(
                        if (it ==
                            SettingsIssue.Unconfirmed
                        ) {
                            R.string.settings_unknown_hint
                        } else {
                            R.string.settings_failed_hint
                        },
                    ),
                )
            }
            CompactButton(
                stringResource(
                    if (state.pending !=
                        null
                    ) {
                        R.string.settings_retry
                    } else if (state.issue !=
                        null
                    ) {
                        R.string.settings_try_again
                    } else {
                        R.string.save_settings
                    },
                ),
                Modifier.fillMaxWidth().testTag("settings-save"),
                primary = true,
                enabled = state.dirty && !state.preparingCover,
                busy = state.busy,
                click = save,
            )
        }
    }
}

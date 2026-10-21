package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SettingsProblem(issue: SettingsIssue, busy: Boolean, reload: () -> Unit) {
    Column(Modifier.testTag("settings-problem")) {
        Text(
            stringResource(
                when (issue) {
                    SettingsIssue.Conflict -> R.string.settings_conflict
                    SettingsIssue.Forbidden -> R.string.settings_forbidden
                    SettingsIssue.Unconfirmed -> R.string.settings_unconfirmed
                    SettingsIssue.Rejected -> R.string.settings_rejected
                    SettingsIssue.Load -> R.string.settings_load_error
                },
            ),
            color = Palette.error,
        )
        if (issue == SettingsIssue.Conflict || issue == SettingsIssue.Load) {
            TextButton(reload, enabled = !busy, modifier = Modifier.testTag("settings-reload")) {
                Text(stringResource(R.string.settings_reload))
            }
        }
    }
}

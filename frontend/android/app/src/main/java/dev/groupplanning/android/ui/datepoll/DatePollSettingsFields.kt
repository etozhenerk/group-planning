package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.DatePollSettings
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DatePollSettingsFields(
    value: DatePollSettings,
    enabled: Boolean,
    change: (DatePollSettings) -> Unit,
) {
    val settings = listOf(
        Triple(R.string.poll_multiple, value.multipleAnswers) { checked: Boolean ->
            value.copy(multipleAnswers = checked)
        },
        Triple(R.string.poll_revote, value.allowRevoting) { checked: Boolean ->
            value.copy(allowRevoting = checked)
        },
        Triple(R.string.poll_new_options, value.allowNewOptions) { checked: Boolean ->
            value.copy(allowNewOptions = checked)
        },
        Triple(R.string.poll_anonymous, value.anonymous) { checked: Boolean ->
            value.copy(anonymous = checked)
        },
        Triple(R.string.poll_hidden, value.hideResults) { checked: Boolean ->
            value.copy(hideResults = checked)
        },
    )
    Column {
        settings.forEach { (resource, selected, update) ->
            val label = stringResource(resource)
            Row(
                Modifier.fillMaxWidth().heightIn(
                    min = DesignTokens.componentMobileFormSwitchRowHeight,
                )
                    .semantics { contentDescription = label }
                    .toggleable(selected, enabled = enabled, role = Role.Switch) {
                        change(update(it))
                    },
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileFormSectionGap,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    label,
                    Modifier.weight(1f),
                    fontSize = DesignTokens.typographySizeButton,
                )
                Switch(
                    selected,
                    onCheckedChange = null,
                    enabled = enabled,
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = DesignTokens.colorAccent,
                        checkedThumbColor = DesignTokens.colorOwnText,
                        uncheckedTrackColor = DesignTokens.colorBorderStrong,
                        uncheckedThumbColor = DesignTokens.colorMuted,
                    ),
                )
            }
        }
    }
}

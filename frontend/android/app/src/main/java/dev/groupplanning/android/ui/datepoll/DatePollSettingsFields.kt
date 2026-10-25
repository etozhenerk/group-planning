package dev.groupplanning.android.ui.datepoll

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.DatePollSettings
import dev.groupplanning.android.ui.components.DesignCheckbox

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
    settings.forEach { (resource, selected, update) ->
        val label = stringResource(resource)
        DesignCheckbox(label, selected, enabled) { change(update(it)) }
    }
}

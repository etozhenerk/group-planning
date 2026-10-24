package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R

@Composable
internal fun MeetingActions(
    enabled: Boolean,
    date: () -> Unit,
    place: () -> Unit,
    task: () -> Unit,
) {
    var open by rememberSaveable { mutableStateOf(false) }
    val label = stringResource(R.string.meeting_add)
    Box {
        IconButton({ open = true }, enabled = enabled, modifier = Modifier.testTag("meeting-add")) {
            Text("+", Modifier.semantics { contentDescription = label })
        }
        DropdownMenu(open, { open = false }) {
            DropdownMenuItem(
                text = { Text(stringResource(R.string.meeting_propose_date)) },
                onClick = {
                    open = false
                    date()
                },
                modifier = Modifier.testTag("new-date-poll"),
            )
            DropdownMenuItem(
                text = { Text(stringResource(R.string.place_poll_title)) },
                onClick = {
                    open = false
                    place()
                },
                modifier = Modifier.testTag("new-place-poll"),
            )
            DropdownMenuItem(text = {
                Text(stringResource(R.string.preparation_propose))
            }, onClick = {
                open =
                    false
                task()
            }, modifier = Modifier.testTag("new-preparation-task"))
        }
    }
}

package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormState
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID

@Composable
internal fun PreparationRecipientField(
    state: PreparationFormState,
    user: UUID,
    enabled: Boolean,
    choose: (UUID?) -> Unit,
    retry: () -> Unit,
) {
    var open by rememberSaveable { mutableStateOf(false) }
    Column {
        Text(stringResource(R.string.preparation_recipient))
        val people = state.participants
        if (people != null) {
            val selected = people.find { it.user.id == state.recipient }
            val label = when {
                state.recipient == null -> stringResource(R.string.preparation_anyone)
                state.recipient == user -> stringResource(R.string.feed_you)
                selected == null -> stringResource(R.string.preparation_recipient_left)
                else -> selected.user.displayName
            }
            Box {
                OutlinedButton(
                    {
                        open = true
                    },
                    enabled = enabled && !state.peopleError,
                    modifier = Modifier.fillMaxWidth().testTag(
                        "preparation-recipient",
                    ),
                ) {
                    Text(label)
                }
                DropdownMenu(open, { open = false }) {
                    DropdownMenuItem(text = {
                        Text(stringResource(R.string.preparation_anyone))
                    }, onClick = {
                        choose(null)
                        open =
                            false
                    })
                    people.forEach { person ->
                        DropdownMenuItem(text = {
                            Text(
                                if (person.user.id ==
                                    user
                                ) {
                                    stringResource(R.string.feed_you)
                                } else {
                                    person.user.displayName
                                },
                            )
                        }, onClick = {
                            choose(person.user.id)
                            open =
                                false
                        })
                    }
                }
            }
        } else if (!state.peopleError) {
            PreparationPeopleLoading()
        }
        if (state.peopleError) {
            Text(stringResource(R.string.preparation_people_error), color = Palette.error)
            TextButton(
                retry,
                enabled = !state.loading && enabled,
                modifier = Modifier.testTag("preparation-people-retry"),
            ) {
                Text(stringResource(R.string.poll_retry))
            }
        }
    }
}

package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormState
import dev.groupplanning.android.ui.components.AppIcon
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
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.preparation_recipient), fontSize = 13.sp, lineHeight = 19.5.sp)
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
                Surface(
                    {
                        open = true
                    },
                    enabled = enabled && !state.peopleError,
                    color = Color(0xff1d1e22),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0x14ffffff)),
                    modifier = Modifier.fillMaxWidth().testTag(
                        "preparation-recipient",
                    ),
                ) {
                    Row(
                        Modifier.padding(horizontal = 14.dp, vertical = 13.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(label, Modifier.weight(1f), fontSize = 13.sp, lineHeight = 20.sp)
                        AppIcon(R.drawable.ic_back, Modifier.size(16.dp).rotate(-90f))
                    }
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

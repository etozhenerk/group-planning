package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
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
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFieldGap)) {
        Text(
            stringResource(R.string.preparation_recipient),
            fontSize = DesignTokens.typographySizeCaption,
            color = DesignTokens.colorMuted,
        )
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
                    color = DesignTokens.colorBackground,
                    shape = RoundedCornerShape(DesignTokens.componentMobileFieldRadius),
                    border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
                    modifier = Modifier.fillMaxWidth().heightIn(
                        min = DesignTokens.targetAndroid,
                    ).testTag(
                        "preparation-recipient",
                    ),
                ) {
                    Row(
                        Modifier.padding(
                            horizontal = DesignTokens.componentMobileFieldInsetInline,
                            vertical = DesignTokens.componentMobileFieldInsetBlock,
                        ),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(label, Modifier.weight(1f), fontSize = DesignTokens.typographySizeBody)
                        ChatIcon(
                            ChatSymbol.Down,
                            Modifier.size(DesignTokens.componentMobileFieldIconSize),
                        )
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

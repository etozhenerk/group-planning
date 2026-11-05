package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationRecipientField(
    form: PreparationFormState,
    user: UUID,
    enabled: Boolean,
    open: () -> Unit,
    retry: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
        Text(
            stringResource(R.string.preparation_recipient),
            fontSize = DesignTokens.typographySizeSmall,
            fontWeight = FontWeight.Medium,
        )
        val person = form.participants?.firstOrNull { it.user.id == form.recipient }?.user
        if (form.participants != null) {
            Surface(
                onClick = open,
                enabled = enabled && !form.peopleError,
                shape = RoundedCornerShape(DesignTokens.componentMobilePreparationRecipientRadius),
                color = DesignTokens.colorNavigation,
                border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
                modifier = Modifier.testTag("preparation-recipient"),
            ) {
                Row(
                    Modifier.fillMaxWidth().heightIn(
                        min = DesignTokens.componentMobilePreparationRecipientMinimumHeight,
                    ).padding(DesignTokens.spaceS12),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
                ) {
                    if (person !=
                        null
                    ) {
                        UserAvatar(
                            person.displayName,
                            person.avatarUrl,
                            size = DesignTokens.componentMobileAvatarSmallSize,
                        )
                    } else {
                        ChatIcon(
                            ChatSymbol.People,
                            Modifier.size(DesignTokens.componentMobileAvatarSmallSize),
                            tint = DesignTokens.colorAccent,
                        )
                    }
                    Text(
                        if (form.recipient ==
                            null
                        ) {
                            stringResource(R.string.preparation_anyone)
                        } else if (person?.id ==
                            user
                        ) {
                            stringResource(R.string.prep_to_you)
                        } else {
                            person?.displayName
                                ?: stringResource(R.string.preparation_recipient_invalid)
                        },
                        Modifier.weight(1f),
                        fontSize = DesignTokens.typographySizeButton,
                    )
                    ChatIcon(
                        ChatSymbol.Right,
                        Modifier.size(DesignTokens.componentMobileChatInlineTaskChevron),
                    )
                }
            }
        } else if (!form.peopleError) {
            CircularProgressIndicator()
        }
        if (form.peopleError) {
            Text(stringResource(R.string.preparation_people_error), color = DesignTokens.colorError)
            TextButton(
                retry,
                enabled = !form.loading && enabled,
                modifier = Modifier.testTag("preparation-people-retry"),
            ) {
                Text(stringResource(R.string.poll_retry))
            }
        }
    }
}

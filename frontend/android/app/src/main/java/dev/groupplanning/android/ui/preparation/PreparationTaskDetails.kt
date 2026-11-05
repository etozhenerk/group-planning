package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

@Composable
internal fun PreparationTaskDetails(state: PreparationTaskState, user: UUID) {
    Column(Modifier.fillMaxWidth().testTag("preparation-task-${state.task?.id}")) {
        val task = state.task
        if (task != null) {
            val status = when (task.state) {
                "accepted" -> R.string.prep_state_accepted
                "completed" -> R.string.prep_state_completed
                "declined" -> R.string.prep_state_declined
                "cancelled" -> R.string.prep_state_cancelled
                else -> R.string.prep_state_offered
            }
            Row(
                Modifier.padding(top = DesignTokens.spaceS8, bottom = DesignTokens.spaceS20),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            ) {
                ChatIcon(
                    when (task.state) {
                        "completed" -> ChatSymbol.Check
                        "declined", "cancelled" -> ChatSymbol.Minus
                        else -> ChatSymbol.Task
                    },
                    Modifier.size(DesignTokens.componentMobileChatIconSize),
                    tint = if (task.state in
                        listOf("declined", "cancelled")
                    ) {
                        DesignTokens.colorMuted
                    } else {
                        DesignTokens.colorAccent
                    },
                )
                Text(
                    stringResource(status),
                    color = if (task.state in
                        listOf("declined", "cancelled")
                    ) {
                        DesignTokens.colorMuted
                    } else {
                        DesignTokens.colorAccent
                    },
                    fontSize = DesignTokens.typographySizeSmall,
                )
            }
            PreparationPersonFact(stringResource(R.string.prep_author), task.author, user)
            PreparationPersonFact(
                stringResource(
                    if (task.assignee !=
                        null
                    ) {
                        R.string.prep_assignee
                    } else {
                        R.string.prep_recipient
                    },
                ),
                task.assignee ?: task.recipient,
                user,
            )
            HorizontalDivider(color = DesignTokens.colorLine)
            Row(
                Modifier.fillMaxWidth().heightIn(
                    min = DesignTokens.componentMobilePreparationRecipientMinimumHeight,
                ).padding(vertical = DesignTokens.spaceS12),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
            ) {
                Text(
                    stringResource(R.string.prep_created),
                    Modifier.weight(1f),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeCaption,
                )
                Text(
                    task.createdAt.instant.atZone(
                        ZoneId.systemDefault(),
                    ).format(
                        DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.forLanguageTag("ru")),
                    ),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeCaption,
                )
            }
            if (task.state == "offered" &&
                task.recipient != null
            ) {
                Text(
                    stringResource(
                        if (task.recipient.id ==
                            user
                        ) {
                            R.string.prep_accept_note
                        } else {
                            R.string.prep_other_note
                        },
                    ),
                    Modifier.padding(top = DesignTokens.spaceS16),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeCaption,
                )
            }
        } else if (state.issue == null) {
            PreparationTaskLoading()
        }
    }
}

@Composable
private fun PreparationPersonFact(label: String, person: UserProfile?, user: UUID) {
    HorizontalDivider(color = DesignTokens.colorLine)
    Row(
        Modifier.fillMaxWidth().heightIn(
            min = DesignTokens.componentMobilePreparationRecipientMinimumHeight,
        ).padding(vertical = DesignTokens.spaceS12),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
    ) {
        Text(
            label,
            Modifier.weight(1f),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeCaption,
        )
        Row(
            Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8, Alignment.End),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (person !=
                null
            ) {
                UserAvatar(
                    person.displayName,
                    person.avatarUrl,
                    size = DesignTokens.componentMobileAvatarSmallSize,
                )
            }
            Text(
                if (person ==
                    null
                ) {
                    stringResource(R.string.preparation_anyone)
                } else if (person.id ==
                    user
                ) {
                    stringResource(R.string.prep_you_suffix, person.displayName)
                } else {
                    person.displayName
                },
                Modifier.weight(1f, fill = false),
                fontSize = DesignTokens.typographySizeSmall,
                textAlign = TextAlign.End,
            )
        }
    }
}

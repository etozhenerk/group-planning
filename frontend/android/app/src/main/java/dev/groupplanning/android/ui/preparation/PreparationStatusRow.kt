package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationStatusRow(task: PreparationTask, user: UUID) {
    val person = if (task.state in
        listOf("completed", "declined", "cancelled")
    ) {
        task.updatedBy
    } else {
        task.assignee
            ?: task.recipient
    }
    Row(
        Modifier.heightIn(min = DesignTokens.spaceS24 + DesignTokens.spaceS4).padding(
            bottom = if (task.canAccept ||
                task.canComplete
            ) {
                DesignTokens.spaceS12 + DesignTokens.spaceS2
            } else {
                DesignTokens.spaceS0
            },
        ),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
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
        if (person ==
            null
        ) {
            ChatIcon(
                ChatSymbol.People,
                Modifier.size(DesignTokens.componentMobilePreparationStatusIconSize),
                tint = DesignTokens.colorAccent,
            )
        }
        Text(
            preparationStatus(task, user),
            color = if (task.state ==
                "completed"
            ) {
                DesignTokens.colorAccent
            } else {
                DesignTokens.colorMuted
            },
            fontSize = DesignTokens.typographySizeCaption,
            lineHeight =
            DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
        )
    }
}

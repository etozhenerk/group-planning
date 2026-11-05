package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatInlineCard
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

@Composable
internal fun PreparationTaskCard(
    state: PreparationTaskState,
    entry: FeedEntry,
    user: UUID,
    act: (PreparationAction) -> Unit,
    retry: () -> Unit,
) {
    var details by rememberSaveable(entry.id.toString()) { mutableStateOf(false) }
    val task = state.task
    ChatInlineCard(
        inset = DesignTokens.spaceS16,
        radius = DesignTokens.componentMobileDecisionCardRadius,
        gap = DesignTokens.spaceS0,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(bottom = DesignTokens.spaceS12 + DesignTokens.spaceS2),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            UserAvatar(
                entry.actor.displayName,
                entry.actor.avatarUrl,
                size = DesignTokens.componentMobileAvatarSmallSize,
            )
            Text(
                entry.actor.displayName,
                Modifier.weight(1f),
                fontSize = DesignTokens.typographySizeCaption,
            )
            Text(
                entry.occurredAt.instant.atZone(
                    ZoneId.systemDefault(),
                ).format(DateTimeFormatter.ofPattern("HH:mm")),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChatIcon(
                ChatSymbol.Task,
                Modifier.size(DesignTokens.componentMobileCreationHintIconSize),
                tint = DesignTokens.colorMuted,
            )
            Text(
                stringResource(R.string.prep_caption),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        if (task != null) {
            Row(
                Modifier.fillMaxWidth().padding(
                    top = DesignTokens.spaceS10,
                    bottom = DesignTokens.spaceS16,
                ).heightIn(min = DesignTokens.targetAndroid)
                    .clickable { details = true }
                    .testTag("preparation-summary-${task.id}"),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    task.title,
                    Modifier.weight(1f),
                    fontWeight = FontWeight(
                        DesignTokens.componentMobilePreparationCardTitleWeight.toInt(),
                    ),
                    fontSize = DesignTokens.componentMobilePreparationCardTitleSize.value.sp,
                    lineHeight =
                    DesignTokens.componentMobilePreparationCardTitleLineHeight.value.sp,
                )
                ChatIcon(
                    ChatSymbol.Right,
                    Modifier.size(DesignTokens.componentMobileChatInlineTaskChevron),
                )
            }
            PreparationStatusRow(task, user)
            PreparationTaskActions(state, act, inline = true)
        } else if (state.issue == null) {
            PreparationTaskLoading()
        }
        if (!details) {
            state.issue?.let {
                Text(
                    preparationIssueText(it),
                    Modifier.testTag("preparation-inline-error"),
                    color = DesignTokens.colorError,
                )
                TextButton(retry, enabled = !state.busy) {
                    Text(stringResource(R.string.poll_retry))
                }
            }
        }
    }
    if (details) PreparationTaskPanel(state, user, act, retry) { details = false }
}

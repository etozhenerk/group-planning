package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.state.preparation.PreparationTaskState
import dev.groupplanning.android.ui.feed.FeedAvatar
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID

@Composable
internal fun PreparationTaskCard(
    state: PreparationTaskState,
    entry: FeedEntry,
    own: Boolean,
    user: UUID,
    act: (PreparationAction) -> Unit,
    retry: () -> Unit,
) {
    val large = LocalDensity.current.fontScale >= 1.5f
    Row(
        Modifier.fillMaxWidth().padding(
            start = if (own &&
                !large
            ) {
                28.dp
            } else {
                0.dp
            },
            end = if (own ||
                large
            ) {
                0.dp
            } else {
                28.dp
            },
        ),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (!own && !large) FeedAvatar(entry.actor.displayName)
        CompositionLocalProvider(
            LocalContentColor provides if (own) Palette.actionText else Palette.text,
        ) {
            Column(
                Modifier.weight(
                    1f,
                ).background(
                    if (own) colorResource(R.color.own_message) else Palette.message,
                    RoundedCornerShape(
                        topStart = if (own) 20.dp else 6.dp,
                        topEnd = if (own) 6.dp else 20.dp,
                        bottomStart = 20.dp,
                        bottomEnd = 20.dp,
                    ),
                ).padding(16.dp).testTag("preparation-task-${state.task?.id}"),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    if (own) stringResource(R.string.feed_you) else entry.actor.displayName,
                    fontWeight = FontWeight.SemiBold,
                )
                val task = state.task
                if (task != null) {
                    Text(task.title, fontWeight = FontWeight.Bold)
                    Text(preparationStatus(task, user))
                    PreparationTaskActions(state, act)
                } else if (state.issue == null) {
                    PreparationTaskLoading()
                }
                state.issue?.let {
                    Text(preparationIssueText(it), modifier = Modifier.testTag("preparation-error"))
                    TextButton(
                        retry,
                        enabled = !state.busy,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = LocalContentColor.current,
                        ),
                        modifier = Modifier.testTag("preparation-retry"),
                    ) {
                        Text(stringResource(R.string.poll_retry))
                    }
                }
            }
        }
        if (own && !large) FeedAvatar(entry.actor.displayName)
    }
}

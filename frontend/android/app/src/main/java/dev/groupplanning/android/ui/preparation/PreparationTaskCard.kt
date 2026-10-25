package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
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
    var details by rememberSaveable(entry.id.toString()) { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Text(
            stringResource(R.string.preparation_proposed_by, entry.actor.displayName),
            Modifier.align(Alignment.CenterHorizontally),
            color = Palette.muted,
            fontSize = 11.sp,
            lineHeight = 16.5.sp,
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(7.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
            FeedAvatar(state.task?.assignee?.displayName ?: entry.actor.displayName)
            Surface(
                { details = true },
                Modifier.testTag("preparation-summary-${state.task?.id}"),
                shape = RoundedCornerShape(18.dp, 18.dp, 18.dp, 5.dp),
                color = Palette.message,
            ) {
                Column(Modifier.padding(horizontal = 13.dp, vertical = 10.dp)) {
                    val task = state.task
                    if (task != null) {
                        Text(
                            task.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            lineHeight = 22.4.sp,
                        )
                        Text(
                            if (task.state == "accepted" && task.assignee != null) {
                                stringResource(
                                    R.string.preparation_accepted_summary,
                                    task.assignee.displayName,
                                )
                            } else {
                                preparationStatus(task, user)
                            },
                            color = Palette.muted,
                            fontSize = 12.sp,
                            lineHeight = 19.2.sp,
                        )
                    } else {
                        PreparationTaskLoading()
                    }
                }
            }
        }
    }
    if (details) {
        Dialog({ details = false }) {
            Surface(shape = RoundedCornerShape(22.dp), color = Palette.surface) {
                Column(
                    Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp),
                ) {
                    PreparationTaskDetails(state, entry, own, user, act, retry)
                    TextButton({ details = false }, Modifier.align(Alignment.End)) {
                        Text(stringResource(R.string.experience_close))
                    }
                }
            }
        }
    }
}

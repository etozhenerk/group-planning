package dev.groupplanning.android.ui.placepoll

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
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.feed.FeedAvatar
import dev.groupplanning.android.ui.theme.Palette
import java.time.Instant

@Composable
internal fun PlacePollCard(
    state: PlacePollState,
    meeting: Meeting,
    entry: FeedEntry,
    own: Boolean,
    vote: (String) -> Unit,
    retry: () -> Unit,
) {
    val large = LocalDensity.current.fontScale >= 1.5f
    Row(
        Modifier.fillMaxWidth().padding(
            start = if (own && !large) 28.dp else 0.dp,
            end = if (own || large) 0.dp else 28.dp,
        ),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (!own && !large) FeedAvatar(entry.actor.displayName)
        CompositionLocalProvider(
            LocalContentColor provides if (own) Palette.actionText else Palette.text,
        ) {
            Column(
                Modifier.weight(1f).background(
                    if (own) colorResource(R.color.own_message) else Palette.message,
                    RoundedCornerShape(
                        topStart = if (own) 20.dp else 6.dp,
                        topEnd = if (own) 6.dp else 20.dp,
                        bottomStart = 20.dp,
                        bottomEnd = 20.dp,
                    ),
                ).padding(16.dp).testTag("place-poll-${state.poll?.id}"),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    if (own) stringResource(R.string.feed_you) else entry.actor.displayName,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    stringResource(
                        if (own) R.string.place_poll_own_proposal else R.string.place_poll_proposal,
                    ),
                    fontWeight = FontWeight.Bold,
                )
                val poll = state.poll
                if (poll != null) {
                    Text(poll.place, fontWeight = FontWeight.Bold)
                    val status = when (poll.state) {
                        "applied" -> R.string.place_poll_applied
                        "rejected" -> R.string.place_poll_unchanged_result
                        "cancelled" -> R.string.place_poll_cancelled
                        "open" -> if (!poll.canVote ||
                            !poll.closesAt.instant.isAfter(Instant.now())
                        ) {
                            R.string.place_poll_finished
                        } else {
                            null
                        }
                        else -> R.string.feed_unknown
                    }
                    Text(
                        status?.let { stringResource(it) }
                            ?: stringResource(
                                R.string.poll_until,
                                meetingTime(poll.closesAt, meeting.timezone),
                            ),
                    )
                    PlacePollBallot(state, vote)
                } else if (state.issue == null) {
                    PlacePollLoading()
                }
                state.issue?.let {
                    Text(placeIssueText(it), modifier = Modifier.testTag("place-poll-error"))
                }
                if (state.pending != null || state.poll == null && state.issue != null) {
                    TextButton(
                        retry,
                        enabled = !state.busy,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = LocalContentColor.current,
                        ),
                    ) {
                        Text(stringResource(R.string.poll_retry))
                    }
                }
            }
        }
        if (own && !large) FeedAvatar(entry.actor.displayName)
    }
}

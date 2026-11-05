package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PlacePollFooter(poll: PlacePoll, meeting: Meeting, status: Int?) {
    FlowRow(
        Modifier.fillMaxWidth().padding(top = DesignTokens.spaceS16).testTag("place-poll-status"),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
    ) {
        Text(
            if (poll.state == "open") {
                status?.let { stringResource(it) } ?: stringResource(
                    R.string.poll_until,
                    meetingTime(poll.closesAt, meeting.timezone),
                )
            } else if (poll.state == "applied") {
                stringResource(R.string.place_poll_finished)
            } else {
                meeting.place ?: stringResource(R.string.place_still_current)
            },
            Modifier.padding(end = DesignTokens.spaceS12),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeLabel,
        )
        if (poll.state == "open") {
            Text(
                stringResource(R.string.place_still_current),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
            )
        }
    }
}

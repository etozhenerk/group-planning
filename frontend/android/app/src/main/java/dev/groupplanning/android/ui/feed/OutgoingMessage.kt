package dev.groupplanning.android.ui.feed

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun OutgoingMessage(
    state: MessageState,
    profile: UserProfile,
    retry: () -> Unit,
    recover: () -> Unit,
) {
    val pending = state.pending ?: return
    FeedMessage(
        profile,
        pending.createdAt,
        pending.text,
        own = true,
        Modifier.testTag("message-pending"),
    ) {
        if (state.sending) {
            Text(stringResource(R.string.message_sending), color = Palette.muted, fontSize = 12.sp)
        } else {
            Text(
                stringResource(
                    if (pending.rejected) {
                        R.string.message_rejected
                    } else {
                        R.string.message_unconfirmed
                    },
                ),
                color = Palette.error,
                fontSize = 12.sp,
            )
            TextButton(
                if (pending.rejected) recover else retry,
                Modifier.testTag("message-retry"),
            ) {
                Text(
                    stringResource(
                        if (pending.rejected) {
                            R.string.message_recover
                        } else {
                            R.string.message_retry
                        },
                    ),
                )
            }
        }
    }
}

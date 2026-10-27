package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OutgoingStatus(
    pending: PendingMessage,
    canRecover: Boolean,
    retry: () -> Unit,
    recover: () -> Unit,
) {
    val status = when (pending.status) {
        DeliveryStatus.Queued, DeliveryStatus.Sending -> R.string.message_sending
        DeliveryStatus.Uncertain -> R.string.message_unconfirmed
        DeliveryStatus.Rejected -> R.string.message_rejected
    }
    Text(
        stringResource(status),
        color = if (pending.rejected) DesignTokens.colorError else DesignTokens.colorMuted,
        fontSize = DesignTokens.typographySizeLabel,
    )
    if (pending.status == DeliveryStatus.Uncertain || pending.rejected) {
        Row {
            TextButton(retry, Modifier.testTag("message-retry")) {
                Text(stringResource(R.string.message_retry))
            }
            if (pending.rejected) {
                TextButton(recover, Modifier.testTag("message-recover"), enabled = canRecover) {
                    Text(stringResource(R.string.message_recover))
                }
            }
        }
    }
}

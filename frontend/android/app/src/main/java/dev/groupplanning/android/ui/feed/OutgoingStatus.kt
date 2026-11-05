package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OutgoingStatus(
    pending: PendingMessage,
    canRecover: Boolean,
    retry: () -> Unit,
    recover: () -> Unit,
) {
    var menu by remember { mutableStateOf(false) }
    val failedLabel = stringResource(R.string.message_rejected)
    if (pending.rejected) {
        Box {
            IconButton(
                {
                    menu = true
                },
                Modifier.size(DesignTokens.targetAndroid).testTag("message-error").semantics {
                    contentDescription =
                        failedLabel
                },
            ) {
                ChatIcon(ChatSymbol.Alert, tint = DesignTokens.colorError)
            }
            DropdownMenu(menu, { menu = false }) {
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.message_retry_full)) },
                    onClick = {
                        retry()
                        menu = false
                    },
                    modifier = Modifier.testTag("message-retry"),
                )
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.message_restore_full)) },
                    onClick = {
                        recover()
                        menu = false
                    },
                    enabled = canRecover,
                    modifier = Modifier.testTag("message-recover"),
                )
            }
        }
        return
    }
    val status = when (pending.status) {
        DeliveryStatus.Queued, DeliveryStatus.Sending -> return
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

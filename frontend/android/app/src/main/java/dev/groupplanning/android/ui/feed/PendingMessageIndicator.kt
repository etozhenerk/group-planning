package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.state.feed.pendingIndicatorDelay
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.Instant
import kotlinx.coroutines.delay

@Composable
internal fun PendingMessageIndicator(pending: PendingMessage?) {
    val active =
        pending?.status == DeliveryStatus.Queued || pending?.status == DeliveryStatus.Sending
    var visible by remember(pending?.key) { mutableStateOf(false) }
    LaunchedEffect(pending?.key, active) {
        visible = false
        if (active) {
            delay(
                pendingIndicatorDelay(
                    pending.createdAt.instant,
                    Instant.now(),
                    DesignTokens.componentMessageDeliveryPendingDelay.toLong(),
                ),
            )
            visible = true
        }
    }
    if (active && visible) {
        val label = stringResource(R.string.message_sending)
        CircularProgressIndicator(
            Modifier.size(DesignTokens.componentMessageDeliveryIndicatorSize)
                .testTag("message-pending-indicator").semantics { contentDescription = label },
            color = DesignTokens.colorMuted,
            strokeWidth = DesignTokens.componentIconStrokeWidth.dp,
        )
    }
}

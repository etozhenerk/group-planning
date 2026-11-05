package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatReceipt(count: ServerCounter?, open: () -> Unit) {
    val read = count != null && count != ServerCounter.Zero
    val label = if (read) {
        stringResource(R.string.chat_read_count, count!!.value)
    } else {
        stringResource(
            if (count ==
                null
            ) {
                R.string.chat_receipt_unknown
            } else {
                R.string.chat_receipt_zero
            },
        )
    }
    IconButton(
        open,
        Modifier.layout { measurable, constraints ->
            val target = DesignTokens.targetAndroid.roundToPx()
            val icon = measurable.measure(
                constraints.copy(
                    minWidth = target,
                    maxWidth = target,
                    minHeight = target,
                    maxHeight = target,
                ),
            )
            val width = DesignTokens.componentMobileMessageReceiptWidth.roundToPx()
            val height = DesignTokens.componentMobileMessageReceiptHeight.roundToPx()
            layout(width, height) {
                icon.placeRelative((width - target) / 2, (height - target) / 2)
            }
        }.size(DesignTokens.targetAndroid).testTag("chat-read-receipt").semantics {
            contentDescription =
                label
        },
    ) {
        Canvas(Modifier.size(DesignTokens.spaceS20, DesignTokens.spaceS16 - DesignTokens.spaceS1)) {
            val x = size.width / 24
            val y = size.height / 18
            val path = Path().apply {
                moveTo(2 * x, 9 * y)
                lineTo(6 * x, 13 * y)
                lineTo(16 * x, 3 * y)
                if (read) {
                    moveTo(10 * x, 12 * y)
                    lineTo(11 * x, 13 * y)
                    lineTo(22 * x, 2 * y)
                }
            }
            drawPath(
                path,
                DesignTokens.colorOwnText.copy(
                    alpha = if (read) {
                        1f
                    } else {
                        DesignTokens.componentMobileMessageReceiptMutedOpacity
                    },
                ),
                style = Stroke(
                    (
                        if (read) {
                            DesignTokens.componentMobileMessageReceiptReadStroke
                        } else {
                            DesignTokens.componentMobileMessageReceiptSentStroke
                        }
                        ) *
                        x,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

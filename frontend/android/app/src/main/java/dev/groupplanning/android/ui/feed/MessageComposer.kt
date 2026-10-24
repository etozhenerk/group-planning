package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MessageComposer(
    state: MessageState,
    change: (String) -> Unit,
    send: () -> Unit,
    openPoll: () -> Unit,
    openPlace: () -> Unit,
    openTask: () -> Unit,
) {
    val label = stringResource(R.string.message_label)
    val sendLabel = stringResource(R.string.message_send)
    Row(
        Modifier.fillMaxWidth().background(
            colorResource(R.color.composer),
            RoundedCornerShape(28.dp),
        ).padding(4.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        MeetingActions(state.ready, openPoll, openPlace, openTask)
        BasicTextField(
            state.draft,
            change,
            Modifier.weight(1f).padding(start = 14.dp, top = 14.dp, bottom = 14.dp)
                .testTag("message-composer").semantics { contentDescription = label },
            enabled = state.ready && !state.sending,
            textStyle = TextStyle(color = Palette.text, fontSize = 15.sp),
            cursorBrush = SolidColor(Palette.accent),
            maxLines = 5,
            decorationBox = { input ->
                if (state.draft.isEmpty()) {
                    Text(
                        stringResource(R.string.message_placeholder),
                        color = Palette.muted,
                        fontSize = 15.sp,
                    )
                }
                input()
            },
        )
        IconButton(
            send,
            Modifier.size(48.dp).background(
                if (state.canSend) Palette.action else Palette.surface,
                CircleShape,
            ).testTag("message-send").semantics {
                contentDescription = sendLabel
            },
            enabled = state.canSend,
        ) {
            AppIcon(
                R.drawable.ic_send,
                tint = if (state.canSend) Palette.actionText else Palette.muted,
            )
        }
    }
}

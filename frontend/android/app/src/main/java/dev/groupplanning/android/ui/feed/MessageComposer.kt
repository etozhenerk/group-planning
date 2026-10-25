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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.TextFieldValue
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
    openPhoto: () -> Unit = {},
    openFile: () -> Unit = {},
) {
    var panel by rememberSaveable { mutableStateOf<String?>(null) }
    var field by rememberSaveable(stateSaver = TextFieldValue.Saver) {
        mutableStateOf(TextFieldValue(state.draft))
    }
    LaunchedEffect(state.draft) {
        if (field.text !=
            state.draft
        ) {
            field = TextFieldValue(state.draft, TextRange(state.draft.length))
        }
    }
    if (panel == "emoji") {
        EmojiSheet({ emoji ->
            val start = field.selection.min
            val text = field.text.replaceRange(start, field.selection.max, emoji)
            field = TextFieldValue(text, TextRange(start + emoji.length))
            change(text)
            panel = null
        }, { panel = null })
    }
    val label = stringResource(R.string.message_label)
    val sendLabel = stringResource(R.string.message_send)
    Row(
        Modifier.fillMaxWidth().background(
            Palette.surface,
            RoundedCornerShape(22.dp),
        ).padding(7.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        MeetingActions(state.ready, panel == "add", {
            panel = if (it) "add" else null
        }, openPhoto, openFile, openPoll, openPlace, openTask)
        BasicTextField(
            field,
            { value ->
                field = value
                change(value.text)
            },
            Modifier.weight(1f).padding(start = 2.dp, top = 12.dp, bottom = 12.dp)
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
        IconButton({
            panel = if (panel ==
                "emoji"
            ) {
                null
            } else {
                "emoji"
            }
        }, Modifier.size(44.dp).testTag("emoji-open")) {
            val emojiLabel = stringResource(R.string.emoji_choose)
            AppIcon(R.drawable.ic_emoji, Modifier.semantics { contentDescription = emojiLabel })
        }
        IconButton(
            send,
            Modifier.size(44.dp).background(
                Palette.action,
                CircleShape,
            ).testTag("message-send").semantics {
                contentDescription = sendLabel
            },
            enabled = state.canSend,
        ) {
            AppIcon(
                R.drawable.ic_send,
                tint = Palette.actionText,
            )
        }
    }
}

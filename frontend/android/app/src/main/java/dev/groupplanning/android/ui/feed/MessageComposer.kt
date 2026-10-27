package dev.groupplanning.android.ui.feed

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.Dp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MessageComposer(
    state: MessageState,
    change: (String) -> Unit,
    send: () -> Unit,
    openPoll: () -> Unit,
    openPlace: () -> Unit,
    openTask: () -> Unit,
    dockHeight: Dp,
    openPhoto: () -> Unit = {},
    openFile: () -> Unit = {},
) {
    val presentation = LocalChatPresentation.current
    var field by rememberSaveable(stateSaver = TextFieldValue.Saver) {
        mutableStateOf(TextFieldValue(state.draft))
    }
    val inputFocus = remember { FocusRequester() }
    val emojiFocus = remember { FocusRequester() }
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val emojiOpen = presentation.composerPanel == "emoji"
    val update: (TextFieldValue) -> Unit = {
        val length = it.text.codePointCount(0, it.text.length)
        val previous = state.draft.codePointCount(0, state.draft.length)
        if (state.ready && !state.recovering && (length <= 4000 || length < previous)) {
            field = it
            change(it.text)
        }
    }
    val dismiss = {
        presentation.composerPanel = null
        focus.clearFocus()
        emojiFocus.requestFocus()
        keyboard?.hide()
    }
    LaunchedEffect(state.draft, state.ready) {
        if (state.ready && field.text != state.draft) {
            field = TextFieldValue(state.draft, TextRange(state.draft.length))
        }
    }
    BackHandler(emojiOpen) { dismiss() }
    val label = stringResource(R.string.message_label)
    val sendLabel = stringResource(R.string.message_send)
    val emojiLabel = stringResource(
        if (emojiOpen) R.string.emoji_keyboard else R.string.emoji_choose,
    )
    val emojiState = stringResource(
        if (emojiOpen) R.string.emoji_expanded else R.string.emoji_collapsed,
    )
    val inputStyle = TextStyle(
        color = DesignTokens.colorText,
        fontSize = DesignTokens.typographySizeBody,
        lineHeight = DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
    )
    Column(
        Modifier.onPreviewKeyEvent {
            if (emojiOpen && it.key == Key.Escape && it.type == KeyEventType.KeyUp) {
                dismiss()
                true
            } else {
                false
            }
        },
    ) {
        HorizontalDivider(color = DesignTokens.colorLine)
        Row(
            Modifier.fillMaxWidth().padding(
                start = DesignTokens.componentChatComposerPaddingInline,
                end = DesignTokens.componentChatComposerPaddingInline,
                top = DesignTokens.componentChatComposerPaddingTop,
                bottom = DesignTokens.componentChatComposerPaddingBottom,
            ),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentChatComposerGap),
        ) {
            MeetingActions(state.ready, presentation.composerPanel == "add", {
                focus.clearFocus()
                keyboard?.hide()
                presentation.reaction = null
                presentation.composerPanel = if (it) "add" else null
            }, openPhoto, openFile, openPoll, openPlace, openTask)
            Row(
                Modifier.weight(1f).background(
                    DesignTokens.colorSurface,
                    RoundedCornerShape(DesignTokens.componentChatComposerRadius),
                ).border(
                    DesignTokens.spaceS1,
                    DesignTokens.colorLine,
                    RoundedCornerShape(DesignTokens.componentChatComposerRadius),
                ),
                verticalAlignment = Alignment.Bottom,
            ) {
                BasicTextField(
                    field,
                    { next ->
                        // Focus loss collapses Compose selection; the dock keeps its insertion range.
                        if (presentation.composerPanel != "emoji") update(next)
                    },
                    Modifier.weight(1f).focusRequester(inputFocus).onFocusChanged {
                        if (it.isFocused) presentation.dismiss()
                    }.heightIn(max = DesignTokens.componentChatComposerInputMaxHeight).padding(
                        start = DesignTokens.componentChatComposerInputInsetStart,
                        top = DesignTokens.componentChatComposerInputInsetTop,
                        bottom = DesignTokens.componentChatComposerInputInsetBottom,
                    ).testTag("message-composer").semantics { contentDescription = label },
                    enabled = state.ready && !state.recovering,
                    textStyle = inputStyle,
                    cursorBrush = SolidColor(DesignTokens.colorAccent),
                    maxLines = 5,
                    decorationBox = { input ->
                        Box {
                            if (state.draft.isEmpty()) {
                                Text(
                                    stringResource(R.string.message_placeholder),
                                    color = DesignTokens.colorMuted,
                                    style = inputStyle,
                                )
                            }
                            input()
                        }
                    },
                )
                IconButton(
                    {
                        if (emojiOpen) {
                            presentation.composerPanel = null
                            inputFocus.requestFocus()
                            keyboard?.show()
                        } else {
                            presentation.reaction = null
                            presentation.composerPanel = "emoji"
                            field = field.copy(composition = null)
                            focus.clearFocus()
                            keyboard?.hide()
                        }
                    },
                    Modifier.size(DesignTokens.targetAndroid).focusProperties {
                        canFocus = true
                    }.focusRequester(emojiFocus)
                        .testTag("emoji-open").semantics {
                            contentDescription = emojiLabel
                            stateDescription = emojiState
                        },
                    enabled = state.ready && !state.recovering,
                ) {
                    if (emojiOpen) {
                        ChatIcon(
                            ChatSymbol.Keyboard,
                            Modifier.size(DesignTokens.componentChatComposerEmojiIcon),
                        )
                    } else {
                        ComposerSmile()
                    }
                }
            }
            IconButton(
                send,
                Modifier.size(DesignTokens.targetAndroid)
                    .background(DesignTokens.colorAction, CircleShape)
                    .testTag("message-send").semantics { contentDescription = sendLabel },
                enabled = state.canSend,
            ) { ChatIcon(ChatSymbol.Send, tint = DesignTokens.colorActionText) }
        }
        EmojiDock(emojiOpen) {
            EmojiPicker(
                { update(field.insertEmoji(it)) },
                Modifier.fillMaxWidth().height(dockHeight).testTag("emoji-dock"),
                delete = { update(field.deleteGrapheme()) },
            )
        }
    }
}

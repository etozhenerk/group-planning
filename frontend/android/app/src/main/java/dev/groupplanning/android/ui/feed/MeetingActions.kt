package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.FloatingPanel
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingActions(
    enabled: Boolean,
    open: Boolean,
    expand: (Boolean) -> Unit,
    photo: () -> Unit,
    file: () -> Unit,
    date: () -> Unit,
    place: () -> Unit,
    task: () -> Unit,
) {
    val opener = remember { FocusRequester() }
    val label = stringResource(R.string.meeting_add)
    Box {
        IconButton(
            { expand(!open) },
            enabled = enabled,
            modifier = Modifier.size(
                DesignTokens.targetAndroid,
            ).focusProperties { canFocus = true }.focusRequester(opener).testTag("meeting-add")
                .semantics { contentDescription = label },
        ) { ChatIcon(ChatSymbol.Plus) }
        FloatingPanel(open, {
            expand(false)
            opener.requestFocus()
        }) {
            val labels = listOf(
                R.string.experience_photo,
                R.string.experience_file,
                R.string.meeting_propose_date,
                R.string.place_poll_title,
                R.string.preparation_propose,
            )
            val icons = listOf(
                ChatSymbol.Photo,
                ChatSymbol.File,
                ChatSymbol.Calendar,
                ChatSymbol.Pin,
                ChatSymbol.Task,
            )
            val actions = listOf(photo, file, date, place, task)
            val tags = listOf(
                "add-photo",
                "add-file",
                "new-date-poll",
                "new-place-poll",
                "new-preparation-task",
            )
            labels.forEachIndexed { index, title ->
                Row(
                    Modifier.width(
                        DesignTokens.componentChatAddMenuWidth -
                            DesignTokens.componentChatAddMenuInset * 2,
                    ).heightIn(min = DesignTokens.targetAndroid).clickable(enabled = open) {
                        expand(false)
                        actions[index]()
                    }.testTag(
                        tags[index],
                    ).padding(horizontal = DesignTokens.componentMobileFieldInsetInline),
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.componentMobileFieldInsetInline,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(icons[index], tint = Palette.accent)
                    Text(stringResource(title), fontSize = DesignTokens.typographySizeButton)
                }
            }
        }
    }
}

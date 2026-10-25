package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.FloatingPanel
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
    val label = stringResource(R.string.meeting_add)
    Box {
        IconButton(
            { expand(!open) },
            enabled = enabled,
            modifier = Modifier.size(44.dp).testTag("meeting-add")
                .semantics { contentDescription = label },
        ) { AppIcon(R.drawable.ic_plus) }
        if (open) {
            FloatingPanel({ expand(false) }, width = 268.dp) {
                val labels = listOf(
                    R.string.experience_photo,
                    R.string.experience_file,
                    R.string.meeting_propose_date,
                    R.string.place_poll_title,
                    R.string.preparation_propose,
                )
                val icons = listOf(
                    R.drawable.ic_photo,
                    R.drawable.ic_file,
                    R.drawable.ic_calendar,
                    R.drawable.ic_place,
                    R.drawable.ic_check,
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
                    if (index == 2) {
                        HorizontalDivider(
                            Modifier.padding(
                                horizontal = 10.dp,
                                vertical = 6.dp,
                            ),
                            color = Color(0x12ffffff),
                        )
                    }
                    Row(
                        Modifier.width(250.dp).height(48.dp).clickable {
                            expand(false)
                            actions[index]()
                        }.testTag(tags[index]).padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        AppIcon(icons[index], tint = Palette.accent)
                        Text(stringResource(title), fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingDisplayButton(
    calendar: Boolean,
    active: Boolean,
    modifier: Modifier = Modifier,
    choose: () -> Unit,
) {
    val title = stringResource(
        if (calendar) {
            R.string.meetings_calendar
        } else {
            R.string.meetings_list
        },
    )

    Surface(
        onClick = choose,
        modifier = modifier.semantics { selected = active },
        color = colorResource(if (active) R.color.selected_segment else R.color.navigation),
        shape = RoundedCornerShape(9.dp),
        contentColor = if (active) Palette.text else Palette.muted,
    ) {
        Row(
            Modifier.padding(horizontal = 13.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            AppIcon(
                if (calendar) R.drawable.ic_calendar else R.drawable.ic_list,
                modifier = Modifier.size(18.dp),
                tint = if (active) Palette.text else Palette.muted,
            )
            Text(title, fontSize = 13.sp, lineHeight = 19.5.sp)
        }
    }
}

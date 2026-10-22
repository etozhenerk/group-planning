package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingPeriodButton(
    period: MeetingPeriod,
    count: Int?,
    active: Boolean,
    modifier: Modifier = Modifier,
    choose: () -> Unit,
) {
    val title = stringResource(
        if (period == MeetingPeriod.Past) {
            R.string.meetings_past
        } else {
            R.string.meetings_upcoming
        },
    )

    Surface(
        onClick = choose,
        modifier = modifier.semantics { selected = active },
        color = Palette.background,
    ) {
        Column {
            Row(
                Modifier.padding(vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    title,
                    Modifier.weight(1f, fill = false),
                    color = if (active) Palette.text else Palette.muted,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    count?.toString() ?: "—",
                    color = Palette.muted,
                    modifier = Modifier.background(Palette.surface, RoundedCornerShape(20.dp))
                        .padding(horizontal = 7.dp, vertical = 3.dp),
                )
            }
            Box(
                Modifier.fillMaxWidth().height(2.dp).background(
                    if (active) Palette.accent else Palette.background,
                    RoundedCornerShape(2.dp),
                ),
            )
        }
    }
}

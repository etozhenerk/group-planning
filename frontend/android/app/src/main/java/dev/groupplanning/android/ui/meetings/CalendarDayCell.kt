package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun CalendarDayCell(
    day: LocalDate,
    selection: LocalDate,
    count: Int,
    modifier: Modifier = Modifier,
    choose: () -> Unit,
) {
    val active = day == selection
    val today = day == LocalDate.now()
    val label = stringResource(
        R.string.calendar_day_accessible,
        day.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru"))),
        count,
        if (today) stringResource(R.string.calendar_today_accessible) else "",
    )
    val scale = LocalDensity.current.fontScale
    val foreground = when {
        active -> Palette.actionText
        YearMonth.from(day) != YearMonth.from(selection) -> Palette.muted
        else -> Palette.text
    }
    Surface(
        onClick = choose,
        modifier = modifier.testTag("day-$day")
            .alpha(if (YearMonth.from(day) == YearMonth.from(selection)) 1f else 0.5f),
        shape = RoundedCornerShape(14.dp),
        color = Color.Transparent,
    ) {
        Column(
            Modifier.fillMaxSize().clearAndSetSemantics {
                contentDescription = label
                selected = active
            },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                Modifier.size(36.dp)
                    .background(
                        if (active) Palette.action else Color.Transparent,
                        RoundedCornerShape(10.dp),
                    )
                    .then(
                        if (today &&
                            !active
                        ) {
                            Modifier.border(1.dp, Palette.accent, RoundedCornerShape(10.dp))
                        } else {
                            Modifier
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    day.dayOfMonth.toString(),
                    color = foreground,
                    fontSize = (minOf(16f * scale, 22f) / scale).sp,
                    fontWeight = if (active || today) FontWeight.Bold else FontWeight.Normal,
                )
            }
            Row(
                Modifier.height(8.dp),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                repeat(minOf(count, 3)) {
                    Box(Modifier.size(4.dp).background(Palette.accent, CircleShape))
                }
            }
        }
    }
}

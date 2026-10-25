package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    val accent = if (day.dayOfWeek.value >= 6) Color(0xff567464) else Color(0xff695573)
    val foreground = when {
        active -> Color.White
        YearMonth.from(day) != YearMonth.from(selection) -> Palette.muted
        else -> Palette.text
    }
    val weekend = day.dayOfWeek.value >= 6
    val surface = when {
        active -> accent
        count > 0 -> if (weekend) Color(0xff354e46) else Color(0xff46394d)
        else -> Color.Transparent
    }
    Surface(
        onClick = choose,
        modifier = modifier.testTag("day-$day"),
        shape = RoundedCornerShape(13.dp),
        color = surface,
        border = if (active || today) {
            androidx.compose.foundation.BorderStroke(
                1.dp,
                if (weekend) Color(0x95bdd7c7) else Color(0x75d5c0e4),
            )
        } else {
            null
        },
    ) {
        Box(
            Modifier.fillMaxSize().clearAndSetSemantics {
                contentDescription = label
                selected = active
            },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                day.dayOfMonth.toString(),
                color = if (active) {
                    Color.White
                } else if (weekend) {
                    Color(0xffb6d0c3)
                } else {
                    foreground
                },
                fontSize = (minOf(13f * scale, 22f) / scale).sp,
                fontWeight = if (active || today) FontWeight.Bold else FontWeight.Normal,
            )
            if (count > 0) {
                Box(
                    Modifier.align(Alignment.BottomCenter).padding(bottom = 6.dp)
                        .size(4.dp).background(foreground, CircleShape),
                )
            }
        }
    }
}

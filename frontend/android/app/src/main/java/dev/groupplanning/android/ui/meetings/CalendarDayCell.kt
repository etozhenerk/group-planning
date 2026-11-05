package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
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
    val weekend = day.dayOfWeek.value >= 6
    val foreground = when {
        active -> DesignTokens.colorCalendarSelectedText
        YearMonth.from(day) != YearMonth.from(selection) -> DesignTokens.colorCalendarOutsideDay
        weekend -> DesignTokens.colorCalendarWeekendDay
        else -> DesignTokens.colorCalendarDay
    }
    val surface = when {
        active -> if (weekend) {
            DesignTokens.colorCalendarWeekendSelected
        } else {
            DesignTokens.colorCalendarSelected
        }
        count > 0 -> if (weekend) {
            DesignTokens.colorCalendarWeekendEvent
        } else {
            DesignTokens.colorCalendarEvent
        }
        else -> Color.Transparent
    }
    val stroke = when {
        today -> DesignTokens.colorCalendarTodayOutline
        active -> if (weekend) {
            DesignTokens.colorCalendarWeekendSelectedBorder
        } else {
            DesignTokens.colorCalendarSelectedBorder
        }
        else -> Color.Transparent
    }
    val shape = RoundedCornerShape(DesignTokens.componentMobileCalendarSelectionRadius)
    Surface(
        onClick = choose,
        modifier = modifier.testTag("day-$day"),
        color = Color.Transparent,
    ) {
        Box(
            Modifier.fillMaxSize().clearAndSetSemantics {
                contentDescription = label
                selected = active
            },
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier.size(DesignTokens.componentMobileCalendarSelectionSize)
                    .background(surface, shape).border(DesignTokens.spaceS1, stroke, shape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    day.dayOfMonth.toString(),
                    color = foreground,
                    fontSize = (minOf(13f * scale, 22f) / scale).sp,
                    fontWeight = if (active || today) FontWeight.Bold else FontWeight.Normal,
                )
            }
            if (count > 0) {
                Row(
                    Modifier.align(Alignment.BottomCenter)
                        .padding(bottom = DesignTokens.componentMobileCalendarDotsInset),
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS2),
                ) {
                    repeat(minOf(count, 3)) {
                        Box(Modifier.size(DesignTokens.spaceS4).background(foreground, CircleShape))
                    }
                }
            }
        }
    }
}

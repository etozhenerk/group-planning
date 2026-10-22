package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun CalendarMonthControls(
    selection: CalendarSelection,
    change: (CalendarSelection) -> Unit,
) {
    val month = selection.day.format(
        DateTimeFormatter.ofPattern("LLLL yyyy", Locale.forLanguageTag("ru")),
    ).replaceFirstChar(Char::uppercaseChar)
    val controls: @Composable () -> Unit = {
        Surface(
            onClick = { change(selection.select(LocalDate.now())) },
            shape = RoundedCornerShape(12.dp),
            color = Palette.message,
        ) {
            Text(stringResource(R.string.calendar_today), Modifier.padding(12.dp))
        }
        listOf(-1L, 1L).forEach { delta ->
            val previous = delta < 0
            val label = stringResource(
                if (previous) {
                    R.string.calendar_previous
                } else {
                    R.string.calendar_next
                },
            )
            IconButton(
                onClick = { change(selection.shiftMonth(delta)) },
                modifier = Modifier.background(Palette.message, RoundedCornerShape(12.dp))
                    .semantics { contentDescription = label },
            ) {
                AppIcon(
                    R.drawable.ic_back,
                    Modifier.rotate(if (previous) 0f else 180f),
                    Palette.text,
                )
            }
        }
    }

    if (LocalDensity.current.fontScale > 1.3f) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(month, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) { controls() }
        }
    } else {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(month, Modifier.weight(1f), fontSize = 22.sp, fontWeight = FontWeight.Bold)
            controls()
        }
    }
}

package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun PlanExampleRow(
    day: String,
    weekday: String,
    title: String,
    detail: String,
    highlighted: Boolean,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(13.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            Modifier.size(
                52.dp,
                61.dp,
            ).background(
                if (highlighted) {
                    Palette.accent.copy(
                        alpha = 0.12f,
                    )
                } else {
                    androidx.compose.ui.graphics.Color.Transparent
                },
                RoundedCornerShape(15.dp),
            ),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(day, fontSize = 25.sp, fontWeight = FontWeight.Bold, color = Palette.accent)
            Text(weekday, fontSize = 10.sp, color = Palette.muted)
        }
        Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(detail, fontSize = 12.sp, color = Palette.muted)
        }
    }
}

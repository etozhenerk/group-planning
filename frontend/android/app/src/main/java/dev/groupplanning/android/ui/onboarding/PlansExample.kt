package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun PlansExample() {
    PreviewCard(Modifier.rotate(-1.5f)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Мои встречи", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            AppIcon(R.drawable.ic_plus, tint = Palette.accent)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Список", fontSize = 11.sp)
            Text("Календарь · скоро", fontSize = 11.sp, color = Palette.muted)
        }
        PlanExampleRow("24", "СБ", "Суббота без спешки", "19:00 · У Саши", true)
        HorizontalDivider(color = Palette.border)
        PlanExampleRow("25", "ВС", "Кофе в воскресенье", "12:00 · Кофейня на углу", false)
    }
}

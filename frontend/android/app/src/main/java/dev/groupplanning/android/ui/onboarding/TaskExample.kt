package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun TaskExample() {
    Column(
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        SketchBadge("Подготовка к встрече", R.drawable.ic_check)
        PreviewCard(Modifier.rotate(2f)) {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                AppIcon(R.drawable.ic_bag, Modifier.size(45.dp), Palette.accent)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Заказать пиццу", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text("На всех, к семи вечера", fontSize = 13.sp, color = Palette.muted)
                    Text("✓ Миша принял задачу", fontSize = 12.sp, color = Palette.accent)
                }
            }
        }
        Row(
            Modifier.fillMaxWidth().padding(
                horizontal = 12.dp,
            ).background(
                Palette.surface.copy(alpha = 0.55f),
                RoundedCornerShape(18.dp),
            ).padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("□", color = Palette.muted)
            Column {
                Text("Принести настолки", fontSize = 14.sp)
                Text("Пока без ответственного", fontSize = 10.sp, color = Palette.muted)
            }
        }
    }
}

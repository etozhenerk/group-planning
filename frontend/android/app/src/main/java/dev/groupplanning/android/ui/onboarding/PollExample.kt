package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun PollExample() {
    Column(verticalArrangement = Arrangement.spacedBy((-12).dp)) {
        PreviewCard(Modifier.rotate(-2f)) {
            SketchBadge("Предложение Лены", R.drawable.ic_poll)
            Text("А если у Саши?", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("Там большой стол для настолок.", fontSize = 14.sp, color = Palette.muted)
            Row(
                Modifier.fillMaxWidth().background(
                    Palette.accent.copy(alpha = 0.22f),
                    RoundedCornerShape(12.dp),
                ).padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("За", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text("3", fontSize = 14.sp)
            }
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Против", fontSize = 14.sp, color = Palette.muted)
                Text("1", fontSize = 14.sp, color = Palette.muted)
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Box(Modifier.background(Palette.background, CircleShape).padding(7.dp)) {
                SketchBadge("После опроса: у Саши", R.drawable.ic_place)
            }
        }
    }
}

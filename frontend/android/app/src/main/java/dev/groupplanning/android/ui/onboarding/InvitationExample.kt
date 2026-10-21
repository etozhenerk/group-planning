package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
internal fun InvitationExample() {
    Column(verticalArrangement = Arrangement.spacedBy((-12).dp)) {
        PreviewCard(Modifier.padding(end = 8.dp).rotate(-3f)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(
                        54.dp,
                    ).background(Palette.accent.copy(alpha = 0.12f), RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    AppIcon(R.drawable.ic_sparkles, Modifier.size(30.dp), Palette.accent)
                }
                Spacer(Modifier.weight(1f))
                AppIcon(R.drawable.ic_arrow, Modifier.rotate(-45f))
            }
            Text(
                "Суббота без спешки",
                fontSize = 23.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp,
            )
            SketchLine("24 октября · 19:00", R.drawable.ic_calendar)
            SketchLine("У Саши", R.drawable.ic_place)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Box(Modifier.background(Palette.background, CircleShape).padding(7.dp)) {
                SketchBadge("Лена придёт", R.drawable.ic_check)
            }
        }
    }
}

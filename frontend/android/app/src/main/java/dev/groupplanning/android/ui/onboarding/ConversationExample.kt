package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ConversationExample() {
    PreviewCard(Modifier.rotate(1.5f)) {
        Text("Суббота без спешки", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        HorizontalDivider(color = Palette.border)
        Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Box(
                Modifier.size(29.dp).background(Palette.accent, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "Л",
                    color = Palette.actionText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(
                    "Лена",
                    color = Palette.accent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "Может, соберёмся у Саши?\nУ него большой стол.",
                    Modifier.background(
                        Palette.background,
                        RoundedCornerShape(17.dp),
                    ).padding(12.dp),
                    fontSize = 14.sp,
                )
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Text(
                "Настолки возьму!",
                Modifier.background(Palette.accent, RoundedCornerShape(17.dp)).padding(12.dp),
                color = Palette.actionText,
                fontSize = 14.sp,
            )
        }
        Text(
            "Лена придёт",
            Modifier.align(Alignment.CenterHorizontally),
            fontSize = 11.sp,
            color = Palette.muted,
        )
    }
}

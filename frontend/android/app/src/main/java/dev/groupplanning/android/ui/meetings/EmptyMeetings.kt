package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun EmptyMeetings(create: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().padding(vertical = 44.dp).testTag("meetings-empty"),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Surface(color = Palette.surface, shape = RoundedCornerShape(24.dp)) {
            Box(Modifier.size(80.dp), contentAlignment = Alignment.Center) {
                AppIcon(R.drawable.ic_sparkles, Modifier.size(32.dp), Palette.accent)
            }
        }
        Text("С чего начнём?", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text(
            "Создайте встречу и пригласите друзей по ссылке.",
            color = Palette.muted,
            textAlign = TextAlign.Center,
        )
        ActionButton("Создать встречу", onClick = create)
    }
}

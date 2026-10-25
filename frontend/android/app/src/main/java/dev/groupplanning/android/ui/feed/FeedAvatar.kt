package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun FeedAvatar(name: String) {
    Box(
        Modifier.size(25.dp).background(
            listOf(
                Color(0xffb2c4bc),
                Color(0xffc2af9f),
                Color(0xffc2af9f),
                Color(0xffc3b5d1),
            )[(name.firstOrNull()?.code ?: 1) % 4],
            CircleShape,
        ),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name.take(1),
            color = Palette.actionText,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

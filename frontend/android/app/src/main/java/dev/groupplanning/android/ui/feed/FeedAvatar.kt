package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun FeedAvatar(name: String) {
    Box(
        Modifier.size(32.dp).background(colorResource(R.color.avatar_sand), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name.take(1),
            color = Palette.actionText,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

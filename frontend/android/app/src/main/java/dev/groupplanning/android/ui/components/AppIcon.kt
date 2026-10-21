package dev.groupplanning.android.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AppIcon(
    @DrawableRes icon: Int,
    modifier: Modifier = Modifier,
    tint: Color = Palette.muted,
) {
    Icon(painterResource(icon), null, modifier.size(22.dp), tint = tint)
}

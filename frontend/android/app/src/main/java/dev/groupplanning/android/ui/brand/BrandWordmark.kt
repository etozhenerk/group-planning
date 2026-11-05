package dev.groupplanning.android.ui.brand

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun BrandWordmark(
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    rotation: () -> Float = { 0f },
) {
    if (!compact) {
        LaunchWordmark(modifier, rotation)
        return
    }

    Row(
        modifier,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileBrandGap),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            painterResource(R.drawable.ic_brand_compact),
            null,
            Modifier.size(DesignTokens.componentMobileBrandMarkSize),
            tint = Palette.text,
        )
        Text(
            "somewhere",
            fontSize = 21.sp,
            letterSpacing = (-1).sp,
            lineHeight = 31.5.sp,
            fontWeight = FontWeight.ExtraBold,
        )
    }
}

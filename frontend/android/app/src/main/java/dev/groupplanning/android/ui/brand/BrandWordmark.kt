package dev.groupplanning.android.ui.brand

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette
import kotlin.math.roundToInt

@Composable
internal fun BrandWordmark(
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    rotation: () -> Float = { 0f },
) {
    val fontSize = if (compact) 24f else 37.5f
    val density = LocalDensity.current
    val scale = density.fontScale.coerceAtMost(1.3f)
    val size = fontSize * scale
    val xHeight = with(density) { (size * 0.53f).dp.toPx() }
    val gap = with(density) { (if (compact) 9.dp else 13.5.dp).roundToPx() }
    Layout(
        modifier = modifier.semantics(mergeDescendants = true) { contentDescription = "somewhere" },
        content = {
            Icon(
                painterResource(R.drawable.ic_brand_mark),
                null,
                Modifier.size((size * 1.2f).dp).graphicsLayer { rotationZ = rotation() },
                tint = Palette.text,
            )
            Text(
                "somewhere",
                color = Palette.text,
                fontSize = (size / density.fontScale).sp,
                fontWeight = FontWeight(850),
                letterSpacing = (-size * 0.052f).sp,
                maxLines = 1,
            )
        },
    ) { elements, constraints ->
        val icon = elements[0].measure(constraints.copy(minWidth = 0, minHeight = 0))
        val word = elements[1].measure(constraints.copy(minWidth = 0, minHeight = 0))
        val middle = word[FirstBaseline] - xHeight / 2
        val iconTop = (middle - icon.height / 2).roundToInt()
        val top = minOf(0, iconTop)
        val height = maxOf(word.height, iconTop + icon.height) - top
        layout(icon.width + gap + word.width, height) {
            icon.placeRelative(0, iconTop - top)
            word.placeRelative(icon.width + gap, -top)
        }
    }
}

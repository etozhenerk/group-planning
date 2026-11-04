package dev.groupplanning.android.ui.brand

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import kotlin.math.roundToInt

@Composable
internal fun LaunchWordmark(modifier: Modifier, rotation: () -> Float) {
    val density = LocalDensity.current
    val fontScale = density.fontScale.coerceAtMost(1.3f)
    val size = DesignTokens.typographySizeMobileLaunchWord.value * fontScale
    val xHeight = with(density) { (size * 0.53f).dp.toPx() }
    val gap = with(density) { DesignTokens.componentMobileLaunchGap.roundToPx() }
    Layout(
        modifier = modifier.semantics(mergeDescendants = true) {
            contentDescription =
                "somewhere, приложение загружается"
        },
        content = {
            Icon(
                painterResource(R.drawable.ic_brand_mark),
                null,
                Modifier.size(
                    DesignTokens.componentMobileLaunchMarkSize * fontScale,
                ).graphicsLayer {
                    rotationZ = rotation()
                },
                tint = Palette.text,
            )
            Text(
                "somewhere",
                color = Palette.text,
                fontSize = with(density) { size.dp.toSp() },
                fontWeight = FontWeight(DesignTokens.typographyWeightBrand.toInt()),
                letterSpacing =
                with(density) {
                    (-size * DesignTokens.componentMobileLaunchTrackingRatio).dp.toSp()
                },
                maxLines = 1,
            )
        },
    ) { elements, constraints ->
        val icon = elements[0].measure(Constraints())
        val word = elements[1].measure(Constraints())
        val middle = word[FirstBaseline] - xHeight / 2
        val iconTop = (middle - icon.height / 2).roundToInt()
        val top = minOf(0, iconTop)
        val height = maxOf(word.height, iconTop + icon.height) - top
        val contentWidth = icon.width + word.width
        val fit = if (constraints.hasBoundedWidth) {
            minOf(1f, (constraints.maxWidth - gap).coerceAtLeast(0).toFloat() / contentWidth)
        } else {
            1f
        }
        layout(
            constraints.constrainWidth((contentWidth * fit).roundToInt() + gap),
            constraints.constrainHeight((height * fit).roundToInt()),
        ) {
            icon.placeRelativeWithLayer(0, ((iconTop - top) * fit).roundToInt()) {
                scaleX = fit
                scaleY = fit
                transformOrigin = TransformOrigin(0f, 0f)
            }
            word.placeRelativeWithLayer(
                (icon.width * fit).roundToInt() + gap,
                (-top * fit).roundToInt(),
            ) {
                scaleX = fit
                scaleY = fit
                transformOrigin = TransformOrigin(0f, 0f)
            }
        }
    }
}

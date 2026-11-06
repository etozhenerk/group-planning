package dev.groupplanning.android.ui.media

import android.graphics.Bitmap
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun StackPhotoCard(
    image: Bitmap,
    id: String,
    rank: Int,
    description: String?,
    offset: Float,
    assembly: Float,
    full: Boolean,
    motion: Boolean,
    open: () -> Unit,
    modifier: Modifier = Modifier,
    viewportWidth: Float = 1f,
    vertical: Float = 0f,
) {
    val progress = (
        kotlin.math.abs(offset) /
            (viewportWidth * DesignTokens.componentMobileVibeProgressViewportRatio)
        ).coerceIn(0f, 1f)
    val angle by animateFloatAsState(
        if (full) {
            0f
        } else {
            DesignTokens.componentMobileVibeStackInitialAngle +
                rank * DesignTokens.componentMobileVibeStackAngleStep
        },
        tween(if (motion) DesignTokens.motionDurationVibeFade else 0),
        label = "photo-promotion",
    )
    val radius = if (full) DesignTokens.spaceS0 else DesignTokens.componentMobileVibePhotoRadius
    Box(
        modifier.graphicsLayer {
            translationX =
                if (full) {
                    rank * viewportWidth + offset
                } else if (rank == 0) {
                    offset
                } else {
                    0f
                }
            translationY = if (!full && rank == 0) {
                (
                    vertical *
                        DesignTokens.componentMobileVibeVerticalDriftRatio
                    ).coerceIn(
                    -DesignTokens.componentMobileVibeVerticalDriftMaximum.toPx(),
                    DesignTokens.componentMobileVibeVerticalDriftMaximum.toPx(),
                )
            } else {
                0f
            }
            rotationZ = if (full) {
                0f
            } else if (rank == 0) {
                angle * assembly +
                    (offset / density / DesignTokens.componentMobileVibeDragAngleDivisor).coerceIn(
                        -DesignTokens.componentMobileVibeDragAngleMaximum,
                        DesignTokens.componentMobileVibeDragAngleMaximum,
                    )
            } else {
                (angle - progress * DesignTokens.componentMobileVibeStackAngleStep) *
                    assembly
            }
            alpha = if (full) 1f else assembly
        }.shadow(
            if (full) DesignTokens.spaceS0 else DesignTokens.componentMobileVibeCardShadowDown,
            RoundedCornerShape(radius),
        )
            .clip(RoundedCornerShape(radius))
            .background(if (full) Color.Transparent else DesignTokens.colorPhotoFrame)
            .padding(
                if (full) DesignTokens.spaceS0 else DesignTokens.componentMobileVibePhotoBorder,
            )
            .then(if (rank == 0 && !full) Modifier.clickable(onClick = open) else Modifier),
    ) {
        Image(
            image.asImageBitmap(),
            description,
            Modifier.matchParentSize().testTag("media-image-$id")
                .clip(
                    RoundedCornerShape(
                        if (full) {
                            DesignTokens.spaceS0
                        } else {
                            DesignTokens.componentMobileVibePhotoRadius -
                                DesignTokens.componentMobileVibePhotoBorder
                        },
                    ),
                ),
            contentScale = if (full) ContentScale.Fit else ContentScale.Crop,
        )
    }
}

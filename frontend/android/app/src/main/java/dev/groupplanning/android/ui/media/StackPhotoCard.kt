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
) {
    val opacity by animateFloatAsState(
        if (rank == 0) {
            1f
        } else if (rank == 1) {
            .85f
        } else {
            .75f
        },
        tween(if (motion) DesignTokens.motionDurationPhoto else 0),
        label = "photo-promotion-opacity",
    )
    val angle by animateFloatAsState(
        if (full) {
            0f
        } else {
            when (rank) {
                0 -> -1.5f
                1 -> 7f
                else -> -9f
            }
        },
        tween(if (motion) DesignTokens.motionDurationPhoto else 0),
        label = "photo-promotion",
    )
    val radius = if (full) DesignTokens.spaceS0 else DesignTokens.radiusControl
    Box(
        modifier.graphicsLayer {
            translationX = if (rank == 0) offset else 0f
            rotationZ = angle * assembly + if (motion && !full && rank == 0) offset / 40 else 0f
            alpha = assembly * opacity
        }.shadow(
            if (full) DesignTokens.spaceS0 else DesignTokens.spaceS20,
            RoundedCornerShape(radius),
        )
            .clip(RoundedCornerShape(radius))
            .background(if (full) Color.Transparent else DesignTokens.colorPhotoFrame)
            .padding(
                if (full) DesignTokens.spaceS0 else DesignTokens.spaceS4 + DesignTokens.spaceS1,
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
                            DesignTokens.spaceS6 +
                                DesignTokens.spaceS1
                        },
                    ),
                ),
            contentScale = if (full) ContentScale.Fit else ContentScale.Crop,
        )
    }
}

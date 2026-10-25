package dev.groupplanning.android.ui.media

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import kotlinx.coroutines.launch

@Composable
internal fun PhotoStack(
    photos: List<MeetingMedia>,
    index: Int,
    select: (Int) -> Unit,
    model: MediaViewModel,
    open: () -> Unit,
    modifier: Modifier = Modifier,
    full: Boolean = false,
) {
    if (photos.isEmpty()) return
    val offset = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    val current = photos[index.coerceIn(photos.indices)]
    LaunchedEffect(current.id) { model.prefetch(photos, index) }
    val nextLabel = stringResource(R.string.photo_next)
    val previousLabel = stringResource(R.string.photo_previous)
    val count = stringResource(R.string.memories_count, index + 1, photos.size)
    val change: (Int) -> Unit = { delta ->
        if (photos.size >
            1
        ) {
            select((index + delta + photos.size) % photos.size)
        }
    }
    Box(
        modifier.testTag("photo-stack").onKeyEvent {
            if (it.type != KeyEventType.KeyUp) {
                false
            } else {
                when (it.key) {
                    Key.DirectionRight -> {
                        change(1)
                        true
                    }
                    Key.DirectionLeft -> {
                        change(-1)
                        true
                    }
                    else -> false
                }
            }
        }.focusable().semantics {
            contentDescription = count
            liveRegion = LiveRegionMode.Polite
            customActions = listOf(
                CustomAccessibilityAction(nextLabel) {
                    change(1)
                    true
                },
                CustomAccessibilityAction(previousLabel) {
                    change(-1)
                    true
                },
            )
        }.pointerInput(current.id, photos.size, motion) {
            detectHorizontalDragGestures(
                onDragCancel = {
                    scope.launch { offset.animateTo(0f, tween(if (motion) 260 else 0)) }
                },
                onDragEnd = {
                    scope.launch {
                        if (kotlin.math.abs(offset.value) > 56 * density && photos.size > 1) {
                            val direction = if (offset.value < 0) 1 else -1
                            if (motion) {
                                offset.animateTo(
                                    if (direction ==
                                        1
                                    ) {
                                        -size.width.toFloat()
                                    } else {
                                        size.width.toFloat()
                                    },
                                    tween(260),
                                )
                            }
                            change(direction)
                            offset.snapTo(0f)
                        } else {
                            offset.animateTo(0f, tween(if (motion) 260 else 0))
                        }
                    }
                },
            ) { event, delta ->
                if (photos.size >
                    1
                ) {
                    event.consume()
                    scope.launch { offset.snapTo(offset.value + delta) }
                }
            }
        },
        contentAlignment = Alignment.Center,
    ) {
        val frame = if (full) {
            Modifier.matchParentSize()
        } else {
            Modifier.fillMaxWidth(.88f)
                .fillMaxHeight(.77f)
        }
        if (!full && photos.size > 1) {
            listOf(2, 1).forEach { delta ->
                val next = photos[(index + delta) % photos.size]
                Box(
                    frame.graphicsLayer {
                        rotationZ = if (motion) (if (delta == 1) -9f else 7f) else 0f
                        alpha = if (delta == 1) .75f else .85f
                    }.shadow(20.dp, RoundedCornerShape(12.dp))
                        .clip(RoundedCornerShape(12.dp)).background(Color(0xffe4ded4))
                        .padding(5.dp),
                ) {
                    PrivateImage(
                        next.id.toString(),
                        null,
                        { model.content(next) },
                        Modifier.matchParentSize().clip(RoundedCornerShape(7.dp)),
                    )
                }
            }
        }
        Box(
            frame.graphicsLayer {
                translationX = offset.value
                rotationZ = if (motion && !full) -1.5f + offset.value / 40 else 0f
            }.shadow(if (full) 0.dp else 20.dp, RoundedCornerShape(12.dp))
                .clip(RoundedCornerShape(if (full) 0.dp else 12.dp))
                .background(if (full) Color.Transparent else Color(0xffe4ded4))
                .padding(if (full) 0.dp else 5.dp).then(
                    if (full) Modifier else Modifier.clickable(onClick = open),
                ),
        ) {
            PrivateImage(
                current.id.toString(),
                count,
                { model.content(current) },
                Modifier.matchParentSize().clip(RoundedCornerShape(if (full) 0.dp else 7.dp)),
                if (full) ContentScale.Fit else ContentScale.Crop,
            )
        }
    }
}

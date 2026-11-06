package dev.groupplanning.android.ui.media

import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlin.math.abs

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
    val currentIndex = index.coerceIn(photos.indices)
    val current = photos[currentIndex]
    val scope = rememberCoroutineScope()
    val controller = remember(model, full) { PhotoStackController(model, scope) }
    var dragged by remember { mutableStateOf(false) }
    val motion = dev.groupplanning.android.ui.motion.LocalMotionEnabled.current
    val count = stringResource(R.string.memories_count, currentIndex + 1, photos.size)
    val nextLabel = stringResource(R.string.photo_next)
    val previousLabel = stringResource(R.string.photo_previous)
    LaunchedEffect(photos.map { it.id }, currentIndex) {
        model.prefetch(photos, currentIndex)
        controller.loadVisible(photos, currentIndex)
    }
    BoxWithConstraints(modifier, contentAlignment = Alignment.Center) {
        val availableWidth = maxWidth
        val availableHeight = maxHeight
        val width = with(LocalDensity.current) { maxWidth.toPx() }
        val density = LocalDensity.current.density
        val advance: (Int, Boolean, Float) -> Unit = { direction, swipe, velocity ->
            controller.move(
                photos, currentIndex, direction, width, full, motion, swipe, select,
                velocity, density,
            )
        }
        androidx.compose.foundation.layout.Box(
            Modifier.matchParentSize().testTag("photo-stack").onKeyEvent {
                if (it.type != KeyEventType.KeyUp) {
                    false
                } else {
                    when (it.key) {
                        Key.DirectionRight -> {
                            advance(1, false, 0f)
                            true
                        }
                        Key.DirectionLeft -> {
                            advance(-1, false, 0f)
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
                        advance(1, false, 0f)
                        true
                    },
                    CustomAccessibilityAction(previousLabel) {
                        advance(-1, false, 0f)
                        true
                    },
                )
            }.pointerInput(Unit) {
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                    dragged = false
                    waitForUpOrCancellation()
                }
            }.pointerInput(current.id, photos.size, motion) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    val tracker = VelocityTracker()
                    tracker.addPosition(down.uptimeMillis, down.position)
                    var horizontal = false
                    var cancelled = false
                    var finished = false
                    var lastSample = down.uptimeMillis
                    var releaseTime = down.uptimeMillis
                    while (!finished && !cancelled) {
                        val event = awaitPointerEvent()
                        val change = event.changes.firstOrNull { it.id == down.id }
                        if (event.changes.count { it.pressed } > 1 || change == null) {
                            cancelled = true
                        } else if (!change.pressed) {
                            finished = true
                            releaseTime = change.uptimeMillis
                        } else {
                            val distance = change.position - down.position
                            if (!horizontal &&
                                distance.getDistance() >
                                DesignTokens.componentMobileVibeDragSlop.toPx()
                            ) {
                                if (abs(distance.y) > abs(distance.x) *
                                    DesignTokens.componentMobileVibeAxisBias
                                ) {
                                    cancelled = true
                                } else if (!controller.busy && photos.size > 1) {
                                    horizontal = true
                                    dragged = true
                                    controller.drag(distance.x, distance.y)
                                }
                            } else if (horizontal) {
                                val delta = change.position - change.previousPosition
                                controller.drag(delta.x, delta.y)
                            }
                            if (horizontal) {
                                tracker.addPosition(change.uptimeMillis, change.position)
                                lastSample = change.uptimeMillis
                                change.consume()
                            }
                        }
                    }
                    if (cancelled) {
                        if (horizontal) controller.settle(motion)
                    } else if (horizontal) {
                        val distance = abs(controller.offset.value) / density
                        val velocity = if (releaseTime - lastSample >
                            DesignTokens.motionDurationVibeVelocityExpiry
                        ) {
                            0f
                        } else {
                            tracker.calculateVelocity().x
                        }
                        val ratio = if (full) {
                            DesignTokens.componentMobileVibeViewerDistanceRatio
                        } else {
                            DesignTokens.componentMobileVibeDistanceRatio
                        }
                        val threshold = (
                            width / density * (
                                if (full) {
                                    1f
                                } else {
                                    DesignTokens.componentMobileVibeCardWidthRatio
                                }
                                ) * ratio
                            )
                            .coerceAtLeast(DesignTokens.componentMobileVibeDistanceMinimum.value)
                            .coerceAtMost(
                                if (full) {
                                    Float.MAX_VALUE
                                } else {
                                    DesignTokens.componentMobileVibeDistanceMaximum.value
                                },
                            )
                        val flick = if (full) {
                            DesignTokens.componentMobileVibeViewerFlickDistance
                        } else {
                            DesignTokens.componentMobileVibeFlickDistance
                        }
                        if (distance > threshold ||
                            (
                                distance > flick.value &&
                                    abs(velocity) / density >
                                    DesignTokens.componentMobileVibeFlickVelocityPerSecond
                                )
                        ) {
                            advance(if (controller.offset.value < 0) 1 else -1, true, velocity)
                        } else {
                            controller.settle(motion)
                        }
                    }
                }
            },
            contentAlignment = Alignment.Center,
        ) {
            if (controller.images[current.id] == null) {
                if (controller.failed) {
                    TextButton(controller::retry) { Text(stringResource(R.string.media_error)) }
                } else {
                    CircularProgressIndicator(Modifier.testTag("photo-stack-loading"))
                }
            } else {
                val ranks = if (full) {
                    (-1..1).toList()
                } else {
                    (
                        0 until minOf(
                            3,
                            photos.size,
                        )
                        ).toList().asReversed()
                }
                ranks.forEach { rank ->
                    val photo = photos[Math.floorMod(currentIndex + rank, photos.size)]
                    key(if (full) "${photo.id}-$rank" else photo.id.toString()) {
                        controller.images[photo.id]?.let { bitmap ->
                            val cardWidth = if (full) {
                                availableWidth
                            } else {
                                availableWidth * DesignTokens.componentMobileVibeCardWidthRatio
                            }
                            val cardHeight = if (full) {
                                availableHeight
                            } else {
                                availableHeight *
                                    if (availableHeight <=
                                        DesignTokens.componentMobileVibeCompactDeckHeight
                                    ) {
                                        DesignTokens.componentMobileVibeCompactCardHeightRatio
                                    } else {
                                        DesignTokens.componentMobileVibeCardHeightRatio
                                    }
                            }
                            StackPhotoCard(
                                bitmap, photo.id.toString(), rank, if (rank == 0) count else null,
                                controller.offset.value, controller.assembly.value, full, motion,
                                { if (!dragged && !controller.busy) open() },
                                Modifier.size(cardWidth, cardHeight),
                                viewportWidth = width,
                                vertical = controller.vertical,
                            )
                        }
                    }
                }
                if (controller.failed) {
                    TextButton(controller::retry, Modifier.align(Alignment.BottomCenter)) {
                        Text(stringResource(R.string.media_error))
                    }
                }
            }
        }
    }
}

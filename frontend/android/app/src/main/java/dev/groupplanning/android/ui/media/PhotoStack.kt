package dev.groupplanning.android.ui.media

import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
        val advance: (Int, Boolean) -> Unit = { direction, swipe ->
            controller.move(photos, currentIndex, direction, width, full, motion, swipe, select)
        }
        androidx.compose.foundation.layout.Box(
            Modifier.matchParentSize().testTag("photo-stack").onKeyEvent {
                if (it.type != KeyEventType.KeyUp) {
                    false
                } else {
                    when (it.key) {
                        Key.DirectionRight -> {
                            advance(1, false)
                            true
                        }
                        Key.DirectionLeft -> {
                            advance(-1, false)
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
                        advance(1, false)
                        true
                    },
                    CustomAccessibilityAction(previousLabel) {
                        advance(-1, false)
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
                detectHorizontalDragGestures(
                    onDragStart = { dragged = true },
                    onDragCancel = { controller.settle(motion) },
                    onDragEnd = {
                        if (kotlin.math.abs(controller.offset.value) > 56 * density &&
                            photos.size > 1
                        ) {
                            advance(if (controller.offset.value < 0) 1 else -1, true)
                        } else {
                            controller.settle(motion)
                        }
                    },
                ) { event, delta ->
                    if (photos.size > 1 && !controller.busy) {
                        event.consume()
                        controller.drag(delta)
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
                val visible = if (full) listOf(current) else photos.drop(currentIndex).take(3)
                visible.withIndex().toList().asReversed().forEach { (rank, photo) ->
                    key(photo.id) {
                        controller.images[photo.id]?.let { bitmap ->
                            val portrait = bitmap.width < bitmap.height
                            val cardWidth = if (full) {
                                availableWidth
                            } else if (portrait) {
                                minOf(availableWidth * .78f, availableHeight * .88f * 2 / 3)
                            } else {
                                availableWidth * .88f
                            }
                            val cardHeight = if (full) {
                                availableHeight
                            } else {
                                availableHeight *
                                    if (portrait) .88f else .77f
                            }
                            StackPhotoCard(
                                bitmap, photo.id.toString(), rank, if (rank == 0) count else null,
                                controller.offset.value, controller.assembly.value, full, motion,
                                { if (!dragged && !controller.busy) open() },
                                Modifier.size(cardWidth, cardHeight),
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

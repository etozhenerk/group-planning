package dev.groupplanning.android.ui.media

import android.graphics.Bitmap
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.theme.DesignTokens
import java.io.IOException
import java.util.UUID
import kotlin.math.abs
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class PhotoStackController(
    private val model: MediaViewModel,
    private val scope: CoroutineScope,
) {
    val offset = Animatable(0f)
    val assembly = Animatable(1f)
    var vertical by mutableStateOf(0f)
        private set
    val images = mutableStateMapOf<UUID, Bitmap>()
    var busy by mutableStateOf(false)
        private set
    var failed by mutableStateOf(false)
        private set
    private var repeat: (() -> Unit)? = null

    suspend fun loadVisible(photos: List<MeetingMedia>, index: Int) {
        val positions = listOf(index - 1, index, index + 1, index + 2)
        val visible = positions.map { photos[Math.floorMod(it, photos.size)] }.distinctBy { it.id }
        images.keys.retainAll(visible.map { it.id }.toSet())
        failed = false
        repeat = { scope.launch { loadVisible(photos, index) } }
        for (photo in visible) {
            try {
                images[photo.id] = model.bitmap(photo)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (photo.id == photos[index].id) failed = true
            } catch (_: IOException) {
                if (photo.id == photos[index].id) failed = true
            }
        }
    }

    fun retry() {
        repeat?.invoke()
    }

    fun drag(delta: Float, dy: Float) {
        if (!busy) {
            vertical += dy
            scope.launch { offset.snapTo(offset.value + delta) }
        }
    }

    fun settle(motion: Boolean) {
        if (!busy) {
            busy = true
            scope.launch {
                try {
                    restore(motion)
                } finally {
                    busy = false
                }
            }
        }
    }

    fun move(
        photos: List<MeetingMedia>,
        index: Int,
        direction: Int,
        width: Float,
        full: Boolean,
        motion: Boolean,
        fromSwipe: Boolean,
        select: (Int) -> Unit,
        velocity: Float = 0f,
        density: Float = 1f,
    ) {
        if (busy || photos.size < 2) return
        val target = PhotoStackNavigation.target(index, direction, photos.size, fromSwipe && !full)
        val restart = !full && fromSwipe && target == 0 && index == photos.lastIndex
        busy = true
        failed = false
        repeat = { move(photos, index, direction, width, full, motion, fromSwipe, select) }
        scope.launch {
            try {
                if (model.cached(photos[target]) == null) restore(motion)
                images[photos[target].id] = model.bitmap(photos[target])
                if (restart) {
                    // A missing neighbour must not block the already prepared first photo.
                    for (photo in photos.take(3)) {
                        model.cached(photo)?.let { images[photo.id] = it }
                    }
                }
                if (motion) {
                    val destination = -direction * width * if (full) {
                        1f
                    } else {
                        (1f + DesignTokens.componentMobileVibeCardWidthRatio)
                    }
                    val duration = if (full) {
                        DesignTokens.motionDurationVibeViewer
                    } else {
                        (
                            abs(destination - offset.value) / density /
                                (
                                    abs(velocity) / density / 1000 +
                                        DesignTokens.componentMobileVibeFlightSpeedBias
                                    )
                            ).toInt().coerceIn(
                            DesignTokens.motionDurationVibeFlightMinimum,
                            DesignTokens.motionDurationVibeFlightMaximum,
                        )
                    }
                    offset.animateTo(destination, tween(duration, easing = easing))
                }
                if (restart && motion) assembly.snapTo(0f)
                vertical = 0f
                offset.snapTo(0f)
                select(target)
                withFrameNanos { }
                if (restart && motion) {
                    assembly.animateTo(
                        1f,
                        tween(DesignTokens.motionDurationVibeAssembly, easing = easing),
                    )
                } else if (motion && !full) {
                    // Keep input locked until the surviving keyed card finishes promotion.
                    kotlinx.coroutines.delay(DesignTokens.motionDurationVibeFade.toLong())
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                failed = true
                restore(motion)
            } catch (_: IOException) {
                failed = true
                restore(motion)
            } finally {
                busy = false
            }
        }
    }

    private val easing = DesignTokens.motionEasingVibeGesture.let {
        CubicBezierEasing(it[0], it[1], it[2], it[3])
    }

    private suspend fun restore(motion: Boolean) {
        vertical = 0f
        offset.animateTo(
            0f,
            tween(if (motion) DesignTokens.motionDurationVibeReturn else 0, easing = easing),
        )
    }
}

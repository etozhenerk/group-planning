package dev.groupplanning.android.state.media

import android.graphics.Bitmap
import dev.groupplanning.android.data.api.ClientFailure
import java.io.IOException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal data class ImageState(
    val bitmap: Bitmap? = null,
    val loading: Boolean = false,
    val error: Boolean = false,
)
internal class ImageController(
    private val scope: CoroutineScope,
    private val initial: Bitmap? = null,
    private val loadBitmap: (suspend () -> Bitmap)? = null,
    private val loadBytes: suspend () -> ByteArray,
) {
    private val mutable = MutableStateFlow(ImageState(bitmap = initial))
    val state = mutable.asStateFlow()
    fun load() {
        if (state.value.loading || state.value.bitmap != null) return
        mutable.value = ImageState(loading = true)
        scope.launch {
            try {
                val bitmap = loadBitmap?.invoke() ?: decodeImage(loadBytes())
                mutable.value = ImageState(bitmap)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                mutable.value =
                    ImageState(error = true)
            } catch (_: IOException) {
                mutable.value = ImageState(error = true)
            }
        }
    }
}

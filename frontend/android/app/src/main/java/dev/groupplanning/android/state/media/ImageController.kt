package dev.groupplanning.android.state.media

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import dev.groupplanning.android.data.api.ClientFailure
import java.io.IOException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal data class ImageState(
    val bitmap: Bitmap? = null,
    val loading: Boolean = false,
    val error: Boolean = false,
)
internal class ImageController(
    private val scope: CoroutineScope,
    private val loadBytes: suspend () -> ByteArray,
) {
    private val mutable = MutableStateFlow(ImageState())
    val state = mutable.asStateFlow()
    fun load() {
        if (state.value.loading) return
        mutable.value = ImageState(loading = true)
        scope.launch {
            try {
                val bytes = loadBytes()
                val bitmap = withContext(Dispatchers.IO) {
                    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                    val options = BitmapFactory.Options().apply {
                        inSampleSize = generateSequence(1) { it * 2 }.first { sample ->
                            bounds.outWidth / sample <= 2048 && bounds.outHeight / sample <= 2048
                        }
                    }
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
                        ?: throw IOException("Invalid image")
                }
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

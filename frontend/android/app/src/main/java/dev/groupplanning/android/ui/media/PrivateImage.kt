package dev.groupplanning.android.ui.media

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.ImageController
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun PrivateImage(
    key: String,
    description: String?,
    load: suspend () -> ByteArray,
    modifier: Modifier = Modifier,
    scale: ContentScale = ContentScale.Crop,
) {
    val scope = rememberCoroutineScope()
    val model = remember(key) { ImageController(scope, load) }
    val state by model.state.collectAsStateWithLifecycle()
    LaunchedEffect(model) { model.load() }
    Box(modifier, contentAlignment = Alignment.Center) {
        state.bitmap?.let {
            Image(
                it.asImageBitmap(),
                description,
                Modifier.matchParentSize().testTag("media-image-$key"),
                contentScale = scale,
            )
        }
        if (state.loading) {
            val loading = stringResource(R.string.calendar_loading)
            Box(
                Modifier.matchParentSize().background(Palette.surface).semantics {
                    contentDescription = loading
                },
            )
        }
        if (state.error) TextButton(model::load) { Text(stringResource(R.string.media_error)) }
    }
}

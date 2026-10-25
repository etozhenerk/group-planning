package dev.groupplanning.android.ui.covers

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CoverPixels(bitmap: Bitmap?, loading: Boolean, modifier: Modifier = Modifier) {
    Box(modifier, contentAlignment = Alignment.Center) {
        when {
            bitmap != null -> Image(
                bitmap.asImageBitmap(),
                stringResource(R.string.cover_description),
                Modifier.fillMaxSize().testTag("meeting-cover"),
                contentScale = ContentScale.Crop,
            )
            loading -> CoverSkeleton()
            else -> Box(
                Modifier.fillMaxSize().background(Palette.message).testTag("cover-unavailable"),
                contentAlignment = Alignment.Center,
            ) {
                Text(stringResource(R.string.cover_unavailable), color = Palette.muted)
            }
        }
    }
}

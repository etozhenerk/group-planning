package dev.groupplanning.android.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.state.media.AvatarImages
import dev.groupplanning.android.state.media.ImageController
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun UserAvatar(
    name: String,
    url: String?,
    modifier: Modifier = Modifier,
    size: Dp = 32.dp,
    avatarColor: Color = Color(0xffc2af9f),
    textSize: TextUnit = (size.value * .35f).sp,
    textColor: Color = DesignTokens.colorRosterText,
    textWeight: FontWeight = FontWeight.SemiBold,
) {
    val fallback = remember { AvatarImages() }
    val images = LocalAvatarImages.current ?: fallback
    val scope = rememberCoroutineScope()
    val image = remember(url, images) {
        url?.let { value ->
            ImageController(scope, images.cached(value), { images.load(value) }) { byteArrayOf() }
        }
    }
    val imageState = image?.state?.collectAsStateWithLifecycle()?.value
    val bitmap = imageState?.bitmap
    LaunchedEffect(image) { image?.load() }
    Box(
        modifier.size(size).clip(CircleShape).background(avatarColor).semantics {
            contentDescription =
                name
        },
        contentAlignment = Alignment.Center,
    ) {
        if (url == null || imageState?.error == true) {
            Text(
                name.trim().take(1),
                color = textColor,
                fontSize = textSize,
                fontWeight = textWeight,
            )
        }
        bitmap?.let {
            Image(
                it.asImageBitmap(),
                null,
                Modifier.matchParentSize(),
                contentScale = ContentScale.Crop,
            )
        }
    }
}

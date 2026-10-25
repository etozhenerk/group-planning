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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.data.repository.AvatarRepository
import dev.groupplanning.android.state.media.ImageController

@Composable
internal fun UserAvatar(
    name: String,
    url: String?,
    modifier: Modifier = Modifier,
    size: Dp = 32.dp,
    avatarColor: Color = Color(0xffc2af9f),
) {
    val repository = remember { AvatarRepository() }
    val scope = rememberCoroutineScope()
    val image = remember(url) { url?.let { ImageController(scope) { repository.bytes(it) } } }
    val bitmap = image?.state?.collectAsStateWithLifecycle()?.value?.bitmap
    LaunchedEffect(image) { image?.load() }
    Box(
        modifier.size(size).clip(CircleShape).background(avatarColor).semantics {
            contentDescription =
                name
        },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name.trim().take(1),
            color = Color(0xff30292a),
            fontSize = (size.value * .35f).sp,
            fontWeight = FontWeight.SemiBold,
        )
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

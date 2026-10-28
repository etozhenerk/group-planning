package dev.groupplanning.android.ui.media

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.UploadItem
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun UploadPhotoPreview(
    row: UploadItem,
    load: suspend () -> ByteArray,
    remove: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val removeLabel = stringResource(R.string.experience_remove) + " " + row.value.fileName
    val removeTarget = DesignTokens.targetAndroid
    val removeOffset = (removeTarget - DesignTokens.componentPhotoPreviewRemoveSize) / 2 +
        DesignTokens.componentPhotoPreviewRemoveOutset
    Box(
        modifier.height(
            DesignTokens.componentPhotoPreviewHeight,
        ).testTag("upload-photo-${row.value.key}"),
    ) {
        PrivateImage(
            row.value.key,
            stringResource(R.string.photo_preview),
            load,
            Modifier.matchParentSize().clip(RoundedCornerShape(DesignTokens.radiusCover)),
        )
        IconButton(
            remove,
            Modifier.align(Alignment.TopEnd).offset(x = removeOffset, y = -removeOffset)
                .size(removeTarget)
                .semantics { contentDescription = removeLabel },
            enabled = enabled,
        ) {
            Box(
                Modifier.size(DesignTokens.componentPhotoPreviewRemoveSize)
                    .background(DesignTokens.colorBackground, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                ChatIcon(ChatSymbol.Close, Modifier.size(DesignTokens.spaceS16))
            }
        }
    }
}

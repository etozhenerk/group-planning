package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.UploadItem
import dev.groupplanning.android.ui.components.DesignField
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun UploadSelectionItem(
    row: UploadItem,
    canRemove: Boolean,
    load: suspend () -> ByteArray,
    captionChange: (String) -> Unit,
    remove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (row.value.sourceUri == null &&
            row.value.contentType.startsWith("image/")
        ) {
            PrivateImage(
                row.value.key,
                stringResource(R.string.photo_preview),
                load,
                Modifier.fillMaxWidth().height(125.dp)
                    .clip(RoundedCornerShape(14.dp)),
            )
        } else {
            FilePreview(row.value.fileName, row.value.size)
        }
        if (!row.value.contentType.startsWith("image/")) {
            val caption = row.value.caption
            val tooLong =
                caption.codePointCount(0, caption.length) > 2000
            DesignField(
                caption,
                captionChange,
                stringResource(R.string.upload_caption),
                stringResource(
                    R.string.upload_caption_placeholder,
                ),
                modifier = Modifier.testTag(
                    "upload-caption-${row.value.key}",
                ),
                enabled = !row.busy &&
                    !row.value.submissionStarted &&
                    row.value.media == null,
                error = tooLong,
                minHeight = 100.dp,
            )
            if (tooLong) {
                Text(
                    stringResource(
                        R.string.upload_caption_limit,
                    ),
                    color = Palette.error,
                    fontSize = 12.sp,
                )
            }
        }
        if (row.busy) {
            LinearProgressIndicator(
                Modifier.fillMaxWidth().height(5.dp),
            )
        }
        if (row.error) {
            Text(
                stringResource(R.string.upload_error),
                color = Palette.error,
                fontSize = 12.sp,
            )
        }
        if (row.value.published) {
            Text(
                stringResource(R.string.upload_ready),
                color = Palette.accent,
                fontSize = 12.sp,
            )
        }
        if (canRemove) {
            TextButton(
                remove,
                enabled = !row.busy,
            ) {
                Text(
                    stringResource(R.string.experience_remove),
                    fontSize = 13.sp,
                )
            }
        }
    }
}

package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun UploadSheet(
    model: MediaViewModel,
    purpose: String,
    close: () -> Unit,
    more: (() -> Unit)? = null,
) {
    val state by model.state.collectAsStateWithLifecycle()
    if (state.revoked) return
    val selected = state.items.filter { it.value.purpose == purpose }
    val photo = selected.all { it.value.contentType.startsWith("image/") }
    val initialBatch = remember(model, purpose) { state.completedBatch }
    val dismiss = {
        model.dismissCompleted(purpose)
        close()
    }
    ActionSheet(
        stringResource(if (photo) R.string.upload_photo_title else R.string.upload_file_title),
        dismiss,
        modifier = Modifier.testTag("upload-sheet"),
        animateClose = true,
        closeRequested = state.completedBatch > initialBatch && state.completedPurpose == purpose,
    ) {
        if (state.selecting) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
            Text(
                stringResource(R.string.upload_preparing),
                fontSize = DesignTokens.typographySizeCaption,
            )
        }
        if (state.selectionError) {
            Text(
                stringResource(R.string.upload_invalid),
                color = DesignTokens.colorError,
                fontSize = DesignTokens.typographySizeCaption,
            )
        }
        if (photo) {
            LazyRow(
                modifier = Modifier.fillMaxWidth().testTag("upload-photo-carousel"),
                contentPadding = PaddingValues(
                    top = DesignTokens.spaceS24,
                    end = DesignTokens.spaceS24,
                    bottom = DesignTokens.spaceS12,
                ),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            ) {
                items(selected, key = { it.value.key }) { row ->
                    UploadPhotoPreview(
                        row,
                        { model.local(row.value) },
                        { model.remove(row.value) },
                        enabled = !state.sending && !state.selecting,
                        modifier = Modifier.width(DesignTokens.componentPhotoPreviewWidth),
                    )
                }
            }
        } else {
            selected.forEach { row ->
                UploadSelectionItem(
                    row,
                    selected.size > 1 || row.error,
                    { model.local(row.value) },
                    { model.caption(row.value.key, it) },
                    { model.remove(row.value) },
                )
            }
        }
        if (state.sending) LinearProgressIndicator(Modifier.fillMaxWidth())
        if (selected.any { it.error }) {
            Text(
                stringResource(R.string.upload_error),
                color = DesignTokens.colorError,
                fontSize = DesignTokens.typographySizeCaption,
            )
        }
        Text(
            stringResource(R.string.upload_visibility),
            fontSize = DesignTokens.typographySizeCaption,
            color = DesignTokens.colorMuted,
        )
        state.limits?.takeIf { state.selectionError }?.let { limits ->
            Text(
                stringResource(
                    R.string.upload_current_limits,
                    limits.maxPhotoBytes / 1_048_576,
                    limits.maxFileBytes / 1_048_576,
                    limits.maxFiles,
                ),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        FlowRow(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            more?.let {
                CompactButton(
                    stringResource(R.string.upload_more),
                    enabled = !state.selecting && !state.sending,
                    icon = R.drawable.ic_plus,
                    click = it,
                )
            }
            CompactButton(
                stringResource(R.string.upload_submit),
                primary = true,
                busy = state.sending,
                enabled = !state.selecting &&
                    !state.sending &&
                    selected.none {
                        val caption = it.value.caption
                        caption.codePointCount(0, caption.length) > 2000
                    } &&
                    selected.any { !it.value.published },
            ) { model.send(purpose) }
        }
    }
}

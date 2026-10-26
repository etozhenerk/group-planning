package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
    val dismiss = {
        model.dismissCompleted(purpose)
        close()
    }
    ActionSheet(
        stringResource(if (photo) R.string.upload_photo_title else R.string.upload_file_title),
        dismiss,
        modifier = Modifier.testTag("upload-sheet"),
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
        selected.chunked(if (photo) 2 else 1).forEach { group ->
            Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
                group.forEach { row ->
                    UploadSelectionItem(
                        row,
                        photo || selected.size > 1 || row.error,
                        { model.local(row.value) },
                        { model.caption(row.value.key, it) },
                        { model.remove(row.value) },
                        Modifier.weight(1f),
                    )
                }
                if (photo && group.size == 1) Box(Modifier.weight(1f))
            }
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
                    enabled = !state.selecting,
                    icon = R.drawable.ic_plus,
                    click = it,
                )
            }
            CompactButton(
                stringResource(R.string.upload_submit),
                primary = true,
                busy = selected.any { it.busy },
                enabled = !state.selecting &&
                    selected.none {
                        val caption = it.value.caption
                        caption.codePointCount(0, caption.length) > 2000
                    } &&
                    selected.any { !it.value.published },
            ) { model.send(purpose) }
        }
    }
}

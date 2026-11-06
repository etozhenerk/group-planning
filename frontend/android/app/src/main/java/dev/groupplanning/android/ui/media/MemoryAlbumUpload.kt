package dev.groupplanning.android.ui.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MemoryAlbumUpload(model: MediaViewModel, close: () -> Unit, choose: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    if (state.revoked) return
    val all = state.items.filter { it.value.purpose == "memory" }
    val initialBatch = remember(model) { state.completedBatch }
    val complete = state.completedBatch > initialBatch && state.completedPurpose == "memory"
    val pending = all.filter { !it.value.published }
    var retained by remember(model) { mutableStateOf(pending) }
    SideEffect { if (!complete && pending.isNotEmpty()) retained = pending }
    // Keep the last carousel mounted while the sheet hides; clearing rows changes its anchors.
    val selected = if (complete) retained else pending
    val busy = state.sending || state.selecting
    ActionSheet(
        stringResource(R.string.vibe_upload_sheet),
        {
            model.dismissCompleted("memory")
            close()
        },
        modifier = Modifier.testTag("upload-sheet"),
        canClose = !busy,
        animateClose = true,
        closeRequested = complete,
    ) {
        if (selected.isEmpty()) {
            Column(
                Modifier.fillMaxWidth().padding(
                    top = DesignTokens.spaceS16,
                    bottom = DesignTokens.spaceS24,
                ),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileVibeNavBottomGap,
                ),
            ) {
                ChatIcon(
                    ChatSymbol.Layers,
                    Modifier.size(DesignTokens.componentMobileVibeUploadEmptyIcon),
                    Palette.accent,
                )
                Text(
                    stringResource(R.string.vibe_upload_title),
                    fontSize = DesignTokens.componentMobileVibeUploadEmptyTitle.value.sp,
                    lineHeight =
                    DesignTokens.componentMobileVibeUploadEmptyTitleLineHeight.value.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    stringResource(R.string.vibe_upload_body),
                    Modifier.widthIn(
                        max = DesignTokens.componentMobileVibeUploadEmptyTextMaximumWidth,
                    ),
                    fontSize = DesignTokens.typographySizeSmall,
                    color = Palette.muted,
                    lineHeight =
                    DesignTokens.componentMobileVibeBodyLineHeight.value.sp,
                    textAlign = TextAlign.Center,
                )
            }
        } else {
            Text(
                stringResource(
                    if (state.partialMemory) {
                        R.string.vibe_remaining
                    } else {
                        R.string.vibe_selected
                    },
                    selected.size,
                ),
                fontSize = DesignTokens.typographySizeSmall,
                color = Palette.muted,
            )
            LazyRow(
                Modifier.fillMaxWidth().testTag("upload-photo-carousel"),
                contentPadding = PaddingValues(
                    top = DesignTokens.spaceS12,
                    end = DesignTokens.spaceS20,
                    bottom = DesignTokens.spaceS12 + DesignTokens.spaceS2,
                ),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            ) {
                items(selected, key = { it.value.key }) { row ->
                    UploadPhotoPreview(
                        row,
                        { model.local(row.value) },
                        { model.remove(row.value) },
                        Modifier.width(DesignTokens.componentMobileVibeUploadPhotoWidth),
                        enabled = !busy,
                        height = DesignTokens.componentMobileVibeUploadPhotoHeight,
                        radius = DesignTokens.componentMobileVibePhotoRadius,
                    )
                }
            }
        }
        if (state.selecting) LinearProgressIndicator(Modifier.fillMaxWidth())
        CompactButton(
            stringResource(
                if (selected.isEmpty()) R.string.vibe_choose else R.string.vibe_choose_more,
            ),
            Modifier.fillMaxWidth(),
            icon = R.drawable.ic_plus,
            enabled = !busy,
            cornerRadius = DesignTokens.componentMobileVibeActionRadius,
            click = choose,
        )
        if (selected.isNotEmpty()) {
            Text(
                stringResource(R.string.vibe_visibility),
                fontSize = DesignTokens.typographySizeCaption,
                color = Palette.muted,
            )
        }
        Column(
            Modifier.fillMaxWidth().padding(top = DesignTokens.spaceS20),
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.componentMobileVibeNavBottomGap,
            ),
        ) {
            if (state.selectionError || selected.any { it.error }) {
                Row(
                    Modifier.fillMaxWidth().testTag("media-upload-error"),
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                    verticalAlignment = Alignment.Top,
                ) {
                    ChatIcon(
                        ChatSymbol.Alert,
                        Modifier.size(DesignTokens.componentMobileFieldIconSize),
                        Palette.error,
                    )
                    Text(
                        stringResource(
                            if (state.selectionError) {
                                R.string.upload_invalid
                            } else {
                                if (state.partialMemory) {
                                    R.string.vibe_partial_error
                                } else {
                                    R.string.upload_error
                                }
                            },
                        ),
                        fontSize = DesignTokens.typographySizeCaption,
                        color = Palette.muted,
                    )
                }
            }
            CompactButton(
                stringResource(
                    if (selected.any {
                            it.error
                        }
                    ) {
                        R.string.vibe_retry_submit
                    } else {
                        R.string.vibe_submit
                    },
                ),
                Modifier.fillMaxWidth().testTag("media-batch-send"),
                primary = true,
                busy = state.sending,
                enabled =
                !busy && selected.isNotEmpty() && selected.none { it.value.sourceUri != null },
                cornerRadius = DesignTokens.componentMobileVibeActionRadius,
            ) {
                model.send("memory")
            }
        }
    }
}

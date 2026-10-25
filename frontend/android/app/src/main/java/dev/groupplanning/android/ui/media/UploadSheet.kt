package dev.groupplanning.android.ui.media

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.DesignField
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.theme.Palette

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
    Dialog(dismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize().testTag("upload-sheet"), color = Palette.background) {
            Box(Modifier.fillMaxSize().safeDrawingPadding()) {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        bottom = 24.dp,
                    ),
                ) {
                    item { MeetingsHeader() }
                    item {
                        Box(Modifier.padding(start = 20.dp, top = 28.dp)) {
                            PageBack(close = dismiss)
                        }
                        Text(
                            stringResource(
                                if (photo) {
                                    R.string.upload_photo_title
                                } else {
                                    R.string.upload_file_title
                                },
                            ),
                            Modifier.padding(start = 20.dp, end = 20.dp, bottom = 24.dp),
                            fontSize = 28.sp,
                            lineHeight = 32.2.sp,
                            letterSpacing = (-.9).sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    item {
                        Column(
                            Modifier.padding(horizontal = 20.dp).fillMaxWidth()
                                .background(
                                    Palette.surface,
                                    RoundedCornerShape(22.dp),
                                ).padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(18.dp),
                        ) {
                            if (state.selecting) {
                                LinearProgressIndicator(Modifier.fillMaxWidth())
                                Text(stringResource(R.string.upload_preparing), fontSize = 12.sp)
                            }
                            if (state.selectionError) {
                                Text(
                                    stringResource(R.string.upload_invalid),
                                    color = Palette.error,
                                    fontSize = 12.sp,
                                )
                            }
                            selected.chunked(if (photo) 2 else 1).forEach { group ->
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    group.forEach { row ->
                                        UploadSelectionItem(
                                            row, photo || selected.size > 1 || row.error,
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
                                fontSize = 12.sp,
                                color = Palette.muted,
                            )
                            state.limits?.takeIf { state.selectionError }?.let { limits ->
                                Text(
                                    stringResource(
                                        R.string.upload_current_limits,
                                        limits.maxPhotoBytes / 1_048_576,
                                        limits.maxFileBytes / 1_048_576,
                                        limits.maxFiles,
                                    ),
                                    fontSize = 11.sp,
                                    color = Palette.muted,
                                )
                            }
                            FlowRow(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp),
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
                                        selected.any {
                                            !it.value.published
                                        },
                                ) { model.send(purpose) }
                            }
                        }
                    }
                }
            }
        }
    }
}

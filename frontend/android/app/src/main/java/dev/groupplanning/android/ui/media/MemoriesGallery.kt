package dev.groupplanning.android.ui.media

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MemoriesGallery(
    title: String,
    model: MediaViewModel,
    add: () -> Unit,
    close: () -> Unit,
    subtitle: String = "",
) {
    val state by model.state.collectAsStateWithLifecycle()
    var index by rememberSaveable { mutableIntStateOf(0) }
    var grid by rememberSaveable { mutableStateOf(false) }
    var full by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(model) { model.loadMemories() }
    LaunchedEffect(state.photos.size) {
        index =
            index.coerceIn(0, state.photos.lastIndex.coerceAtLeast(0))
    }
    if (state.revoked) return
    val back = {
        if (full) {
            full = false
        } else if (grid) {
            grid = false
        } else {
            close()
        }
    }
    Dialog(back, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            Modifier.fillMaxSize().testTag(if (full) "memory-fullscreen" else "memory-gallery"),
            color = if (full) Color(0xff141518) else Palette.background,
        ) {
            if (full) {
                androidx.compose.foundation.layout.Box(
                    Modifier.fillMaxSize().safeDrawingPadding(),
                ) {
                    MemoryViewer(title, subtitle, state.photos, index, { index = it }, model, back)
                }
            } else {
                BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding()) {
                    val stackHeight = (maxHeight * .51f).coerceIn(340.dp, 500.dp)
                    val scrollState = rememberScrollState()
                    Column(
                        Modifier.fillMaxSize().verticalScroll(scrollState).padding(bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(0.dp),
                    ) {
                        Row(
                            Modifier.padding(
                                horizontal = DesignTokens.spaceS20,
                                vertical = DesignTokens.spaceS12,
                            ),
                        ) {
                            PageBack(close = back)
                        }
                        run {
                            Column(Modifier.padding(horizontal = 20.dp).padding(top = 16.dp)) {
                                if (subtitle.isNotEmpty()) {
                                    Text(
                                        subtitle,
                                        fontSize = 13.sp,
                                        color = Palette.muted,
                                    )
                                }
                                Text(
                                    title,
                                    fontSize = 29.sp,
                                    lineHeight = 33.35.sp,
                                    letterSpacing = (-.9).sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(top = 8.dp),
                                )
                                Surface(
                                    add,
                                    Modifier.padding(top = 18.dp),
                                    shape = RoundedCornerShape(13.dp),
                                    color = Palette.action,
                                    contentColor = Palette.actionText,
                                ) {
                                    Row(
                                        Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.spacedBy(9.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        AppIcon(R.drawable.ic_plus, tint = Palette.actionText)
                                        Text(
                                            stringResource(R.string.memories_add),
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                }
                            }
                        }
                        if (state.photos.isEmpty() &&
                            !state.loading
                        ) {
                            Text(stringResource(R.string.memories_empty))
                        }
                        if (grid) {
                            LazyVerticalGrid(
                                GridCells.Fixed(2),
                                Modifier.height(stackHeight).padding(20.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                itemsIndexed(state.photos, key = { _, photo ->
                                    photo.id
                                }) { itemIndex, photo ->
                                    PrivateImage(
                                        photo.id.toString(),
                                        stringResource(
                                            R.string.memories_count,
                                            itemIndex + 1,
                                            state.photos.size,
                                        ),
                                        { model.content(photo) },
                                        Modifier.height(
                                            220.dp,
                                        ).clip(RoundedCornerShape(14.dp)).clickable {
                                            index =
                                                itemIndex
                                            full = true
                                        },
                                        cached = model.cached(photo),
                                        loadBitmap = {
                                            model.bitmap(photo)
                                        },
                                    )
                                }
                            }
                        } else if (state.photos.isNotEmpty()) {
                            PhotoStack(
                                state.photos,
                                index.coerceAtMost(state.photos.lastIndex),
                                {
                                    index =
                                        it
                                },
                                model,
                                { full = true },
                                Modifier.fillMaxWidth().height(
                                    stackHeight,
                                ).padding(horizontal = 12.dp),
                            )
                            GalleryCounter(
                                index,
                                state.photos.size,
                                modifier = Modifier.offset(y = (-6).dp),
                                grid = { grid = true },
                            )
                        }
                        if (state.loading && state.photos.isEmpty()) CircularProgressIndicator()
                        if (state.loadError) {
                            TextButton({
                                model.loadMemories()
                            }) { Text(stringResource(R.string.media_error)) }
                        }
                        if (state.next !=
                            null
                        ) {
                            TextButton({
                                model.loadMemories(true)
                            }) { Text(stringResource(R.string.memories_more)) }
                        }
                    }
                }
            }
        }
    }
}

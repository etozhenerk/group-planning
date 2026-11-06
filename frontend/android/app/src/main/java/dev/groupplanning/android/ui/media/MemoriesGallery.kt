package dev.groupplanning.android.ui.media

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.album.AlbumDownloadController
import dev.groupplanning.android.state.media.MediaViewModel
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
    download: AlbumDownloadController? = null,
) {
    val state by model.state.collectAsStateWithLifecycle()
    var index by rememberSaveable { mutableIntStateOf(0) }
    var grid by rememberSaveable { mutableStateOf(false) }
    var full by rememberSaveable { mutableStateOf(false) }
    DisposableEffect(download) {
        download?.enter()
        onDispose { download?.leave() }
    }
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
            color = if (full) DesignTokens.colorPhotoBackdrop else Palette.background,
        ) {
            if (full) {
                androidx.compose.foundation.layout.Box(
                    Modifier.fillMaxSize().safeDrawingPadding(),
                ) {
                    MemoryViewer(title, state.photos, index, { index = it }, model, back)
                }
            } else {
                BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding()) {
                    var headerHeight by remember { mutableIntStateOf(0) }
                    val density = LocalDensity.current
                    val compact = maxHeight < DesignTokens.componentMobileVibeCompactHeightBoundary
                    val stackHeight = if (compact) {
                        DesignTokens.componentMobileVibeCompactDeckHeight
                    } else {
                        maxOf(
                            DesignTokens.componentMobileVibeDeckMinimumHeight,
                            maxHeight - with(density) { headerHeight.toDp() } -
                                DesignTokens.spaceS12 - DesignTokens.spaceS32,
                        )
                    }
                    val scrollState = rememberScrollState()
                    Column(
                        Modifier.fillMaxSize().verticalScroll(
                            scrollState,
                        ).padding(bottom = DesignTokens.spaceS32),
                        verticalArrangement = Arrangement.spacedBy(0.dp),
                    ) {
                        Column(Modifier.onSizeChanged { headerHeight = it.height }) {
                            Row(
                                Modifier.padding(
                                    horizontal = DesignTokens.spaceS20,

                                ).padding(bottom = DesignTokens.componentMobileVibeNavBottomGap),
                            ) {
                                PageBack(close = back)
                                Spacer(Modifier.weight(1f))
                                GalleryCounter(index, state.photos.size, grid = grid, toggle = {
                                    grid =
                                        !grid
                                })
                            }
                            run {
                                Column(Modifier.padding(horizontal = DesignTokens.spaceS20)) {
                                    Text(
                                        title,
                                        fontSize = DesignTokens.typographySizeHeading,
                                        lineHeight =
                                        DesignTokens.componentMobileVibeTitleLineHeight.value.sp,
                                        letterSpacing =
                                        -DesignTokens.componentMobileVibeTitleTracking.value.sp,
                                        fontWeight = FontWeight(
                                            DesignTokens.componentMobileVibeTitleWeight.toInt(),
                                        ),
                                    )
                                    if (subtitle.isNotEmpty()) {
                                        Text(
                                            subtitle,
                                            Modifier.padding(top = DesignTokens.spaceS8),
                                            fontSize = DesignTokens.typographySizeSmall,
                                            lineHeight =
                                            DesignTokens.componentMobileVibeBodyLineHeight.value.sp,
                                            color = Palette.muted,
                                        )
                                    }
                                    AlbumDownloadControls(
                                        download,
                                        state.photos.isNotEmpty(),
                                        add,
                                        Modifier.padding(top = DesignTokens.spaceS24),
                                    )
                                }
                            }
                        }
                        if (state.photos.isEmpty()) {
                            VibeAlbumState(state.loading, state.loadError) { model.loadMemories() }
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
                                        Modifier.aspectRatio(
                                            1f,
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
                        }
                        if (state.loadError && state.photos.isNotEmpty()) {
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

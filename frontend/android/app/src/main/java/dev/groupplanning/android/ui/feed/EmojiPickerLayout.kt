package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyGridScope
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun EmojiPickerLayout(
    cell: Dp,
    toolbar: @Composable () -> Unit,
    categories: @Composable () -> Unit,
    results: LazyGridScope.() -> Unit,
    modifier: Modifier = Modifier,
) {
    var toolbarHeight by remember { mutableIntStateOf(0) }
    var categoriesHeight by remember { mutableIntStateOf(0) }
    val density = LocalDensity.current
    val controlsHeight = with(density) { (toolbarHeight + categoriesHeight).toDp() }
    BoxWithConstraints(modifier.background(DesignTokens.colorSurface)) {
        val gridHeight = maxOf(cell, maxHeight - controlsHeight)
        Column(Modifier.verticalScroll(rememberScrollState())) {
            Box(Modifier.onSizeChanged { toolbarHeight = it.height }) { toolbar() }
            Column(Modifier.onSizeChanged { categoriesHeight = it.height }) { categories() }
            LazyVerticalGrid(
                GridCells.Adaptive(cell),
                Modifier.height(gridHeight).testTag("emoji-grid"),
                content = results,
            )
        }
    }
}

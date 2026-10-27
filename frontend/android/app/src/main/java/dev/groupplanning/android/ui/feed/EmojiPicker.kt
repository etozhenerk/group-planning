package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyGridScope
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun EmojiPicker(
    select: (String) -> Unit,
    modifier: Modifier = Modifier,
    selectedEmoji: Set<String> = emptySet(),
    delete: (() -> Unit)? = null,
) {
    val model = LocalEmoji.current ?: return
    val catalog by model.items.collectAsStateWithLifecycle()
    val loadError by model.error.collectAsStateWithLifecycle()
    val recent by model.recent.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("") }
    val categories = catalog.distinctBy { it.category }
    val filtered = when {
        query.isNotBlank() -> catalog.filter {
            (it.name + " " + it.keywords.joinToString(" "))
                .contains(query.trim(), ignoreCase = true)
        }
        category == "recent" -> recent.mapNotNull { emoji -> catalog.find { it.emoji == emoji } }
        category.isNotEmpty() -> catalog.filter { it.category == category }
        else -> catalog.filter { it.category == categories.firstOrNull()?.category }
    }
    val toolbar: @Composable () -> Unit = {
        Row(
            Modifier.fillMaxWidth().padding(
                horizontal = DesignTokens.componentEmojiDockToolbarInsetInline,
                vertical = DesignTokens.componentEmojiDockToolbarInsetTop,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val searchLabel = stringResource(R.string.emoji_search)
            Row(
                Modifier.weight(1f).heightIn(min = DesignTokens.targetAndroid)
                    .background(
                        DesignTokens.colorBackground,
                        RoundedCornerShape(DesignTokens.componentEmojiDockSearchRadius),
                    ).padding(horizontal = DesignTokens.componentEmojiDockSearchInset),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ChatIcon(
                    ChatSymbol.Search,
                    Modifier.size(DesignTokens.componentEmojiDockSearchIcon),
                    tint = DesignTokens.colorMuted,
                )
                BasicTextField(
                    query,
                    { query = it },
                    Modifier.weight(1f).testTag("emoji-search").semantics {
                        contentDescription = searchLabel
                    },
                    textStyle = TextStyle(
                        color = DesignTokens.colorText,
                        fontSize = DesignTokens.typographySizeSmall,
                    ),
                    singleLine = true,
                    cursorBrush = SolidColor(DesignTokens.colorAccent),
                    decorationBox = { input ->
                        Box {
                            if (query.isEmpty()) {
                                Text(
                                    searchLabel,
                                    color = DesignTokens.colorMuted,
                                    fontSize = DesignTokens.typographySizeSmall,
                                )
                            }
                            input()
                        }
                    },
                )
            }
            val actionLabel = stringResource(
                if (delete != null) R.string.emoji_delete else R.string.emoji_clear_search,
            )
            IconButton(
                { if (delete != null) delete() else query = "" },
                Modifier.size(DesignTokens.targetAndroid).testTag("emoji-delete").semantics {
                    contentDescription = actionLabel
                },
            ) {
                if (delete != null) ChatIcon(ChatSymbol.Backspace) else ChatIcon(ChatSymbol.Close)
            }
        }
    }
    val categoryRow: @Composable () -> Unit = {
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
            EmojiCategory(
                "◷",
                stringResource(R.string.emoji_recent),
                category == "recent",
            ) {
                category = "recent"
                query = ""
            }
            categories.forEach { item ->
                EmojiCategory(
                    item.emoji,
                    item.categoryName,
                    category == item.category ||
                        (category.isEmpty() && item.category == categories.firstOrNull()?.category),
                ) {
                    category = item.category
                    query = ""
                }
            }
        }
        HorizontalDivider(color = DesignTokens.colorLine)
    }
    val density = LocalDensity.current
    val cell = with(density) {
        maxOf(
            DesignTokens.targetAndroid,
            (
                DesignTokens.typographySizeEmojiChoice *
                    DesignTokens.typographyLineHeightBody
                ).toDp(),
        )
    }
    val results: LazyGridScope.() -> Unit = {
        if (loadError) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                Column {
                    Text(stringResource(R.string.emoji_load_error), color = DesignTokens.colorError)
                    TextButton(model::load) { Text(stringResource(R.string.emoji_retry)) }
                }
            }
        } else {
            items(filtered, key = { it.emoji }) { item ->
                ReactionChoice(
                    item.emoji,
                    item.emoji in selectedEmoji,
                    {
                        model.choose(item.emoji)
                        select(item.emoji)
                    },
                    Modifier.size(cell),
                    label = item.name,
                )
            }
            if (filtered.isEmpty()) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    Text(
                        stringResource(R.string.emoji_none),
                        Modifier.padding(DesignTokens.spaceS12),
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                }
            }
        }
    }
    BoxWithConstraints(modifier.background(DesignTokens.colorSurface)) {
        if (maxHeight < DesignTokens.targetAndroid * 4) {
            LazyVerticalGrid(GridCells.Adaptive(cell), Modifier.testTag("emoji-grid")) {
                item(span = { GridItemSpan(maxLineSpan) }) { toolbar() }
                item(span = { GridItemSpan(maxLineSpan) }) { categoryRow() }
                results()
            }
        } else {
            Column {
                toolbar()
                categoryRow()
                LazyVerticalGrid(
                    GridCells.Adaptive(cell),
                    Modifier.weight(1f).testTag("emoji-grid"),
                    content = results,
                )
            }
        }
    }
}

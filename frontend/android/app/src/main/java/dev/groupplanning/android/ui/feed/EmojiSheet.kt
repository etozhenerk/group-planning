package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.FloatingPanel
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun EmojiSheet(select: (String) -> Unit, close: () -> Unit) {
    val model = LocalEmoji.current ?: return
    val catalog by model.items.collectAsStateWithLifecycle()
    val loadError by model.error.collectAsStateWithLifecycle()
    val recent by model.recent.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("") }
    val keyboard = LocalSoftwareKeyboardController.current
    LaunchedEffect(Unit) { keyboard?.hide() }
    val filtered = catalog.filter { item ->
        if (query.isNotBlank()) {
            (item.name + " " + item.keywords.joinToString(" "))
                .contains(query.trim(), ignoreCase = true)
        } else if (category == "recent") {
            item.emoji in recent
        } else {
            category.isEmpty() || item.category == category
        }
    }
    val categories = catalog.distinctBy { it.category }
    FloatingPanel(close) {
        Column(Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                BasicTextField(
                    query,
                    { query = it },
                    Modifier.weight(1f).background(Color(0xff1d1e22), RoundedCornerShape(12.dp))
                        .padding(11.dp).testTag("emoji-search"),
                    textStyle = TextStyle(color = Palette.text, fontSize = 13.sp),
                    singleLine = true,
                    cursorBrush = SolidColor(Palette.accent),
                    decorationBox = { input ->
                        Box {
                            if (query.isEmpty()) {
                                Text(
                                    stringResource(R.string.emoji_search),
                                    color = Palette.muted,
                                    fontSize = 13.sp,
                                )
                            }
                            input()
                        }
                    },
                )
                val closeLabel = stringResource(R.string.experience_close)
                IconButton(
                    close,
                    Modifier.size(44.dp).semantics {
                        contentDescription = closeLabel
                    },
                ) { Text("×", color = Palette.muted, fontSize = 24.sp) }
            }
            if (query.isBlank() && category.isEmpty() && recent.isNotEmpty()) {
                Text(
                    stringResource(R.string.emoji_recent),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Palette.muted,
                )
                Row(Modifier.horizontalScroll(rememberScrollState())) {
                    recent.forEach { emoji ->
                        IconButton({
                            model.choose(emoji)
                            select(emoji)
                        }, Modifier.size(42.dp)) {
                            Text(emoji, fontSize = 25.sp)
                        }
                    }
                }
            }
            Text(
                if (category == "recent") {
                    stringResource(R.string.emoji_recent)
                } else {
                    categories.firstOrNull { it.category == category }?.categoryName
                        ?: categories.firstOrNull()?.categoryName.orEmpty()
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Palette.muted,
            )
            if (filtered.isEmpty()) Text(stringResource(R.string.emoji_none), fontSize = 13.sp)
            LazyVerticalGrid(GridCells.Fixed(7), Modifier.height(168.dp)) {
                items(filtered, key = { it.emoji }) { item ->
                    IconButton(
                        {
                            model.choose(item.emoji)
                            select(item.emoji)
                        },
                        Modifier.size(42.dp).semantics { contentDescription = item.name },
                    ) {
                        Text(item.emoji, fontSize = 25.sp)
                    }
                }
            }
            HorizontalDivider(color = Color(0x12ffffff))
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                val recentLabel = stringResource(R.string.emoji_recent)
                IconButton(
                    { category = "recent" },
                    Modifier.size(38.dp).semantics {
                        contentDescription = recentLabel
                    },
                ) { Text("◷", color = Palette.muted) }
                categories.forEach { item ->
                    IconButton(
                        { category = item.category },
                        Modifier.size(38.dp).semantics {
                            contentDescription = item.categoryName
                        },
                    ) { Text(item.emoji, fontSize = 13.sp) }
                }
            }
        }
    }
}

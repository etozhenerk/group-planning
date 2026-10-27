package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun EmojiCategory(emoji: String, label: String, active: Boolean, choose: () -> Unit) {
    Box {
        IconButton(
            choose,
            Modifier.size(DesignTokens.targetAndroid).semantics {
                contentDescription = label
                selected = active
            },
        ) { Text(emoji, fontSize = DesignTokens.typographySizeEmojiCategory) }
        if (active) {
            Box(
                Modifier.align(Alignment.BottomCenter)
                    .width(DesignTokens.targetAndroid / 2)
                    .height(DesignTokens.componentEmojiDockCategoryIndicator)
                    .background(DesignTokens.colorAccent),
            )
        }
    }
}

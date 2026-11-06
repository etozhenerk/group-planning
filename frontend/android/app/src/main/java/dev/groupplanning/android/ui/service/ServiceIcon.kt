package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol

@Composable
internal fun ServiceIcon(symbol: ChatSymbol, size: Dp, tint: Color, description: String? = null) {
    ChatIcon(
        symbol,
        Modifier.size(size).semantics {
            description?.let { contentDescription = it }
        },
        tint,
    )
}

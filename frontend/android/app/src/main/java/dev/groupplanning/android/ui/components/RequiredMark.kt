package dev.groupplanning.android.ui.components

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun RequiredMark(modifier: Modifier = Modifier) {
    Text(
        "*",
        modifier.clearAndSetSemantics {},
        fontSize = DesignTokens.componentMobileRequiredFontSize.value.sp,
        lineHeight = DesignTokens.componentMobileRequiredFontSize.value.sp,
        fontWeight = FontWeight(DesignTokens.componentMobileRequiredFontWeight.toInt()),
        color = DesignTokens.colorError,
    )
}

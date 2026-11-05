package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.unit.DpOffset
import dev.groupplanning.android.ui.theme.DesignTokens

internal fun Modifier.sheetFooter(sticky: Boolean): Modifier {
    if (!sticky) return this
    val shape =
        RoundedCornerShape(
            topStart = DesignTokens.componentMobileStickyRadius,
            topEnd = DesignTokens.componentMobileStickyRadius,
        )
    return dropShadow(
        shape,
        Shadow(
            radius = DesignTokens.componentMobileStickyShadowBlur,
            color = DesignTokens.colorMobileStickyShadow,
            offset = DpOffset(
                DesignTokens.spaceS0,
                -DesignTokens.componentMobileStickyShadowUpOffset,
            ),
        ),
    )
        .background(DesignTokens.colorSurface, shape)
}

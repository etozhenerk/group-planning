package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.unit.DpOffset
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationResponsePanel(content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(
        topStart = DesignTokens.radiusSheet,
        topEnd = DesignTokens.radiusSheet,
    )
    Column(
        Modifier.fillMaxWidth()
            .dropShadow(
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
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom))
            .padding(horizontal = DesignTokens.spaceS20)
            .padding(
                top = DesignTokens.componentMobileInvitationFooterInsetTop,
                bottom = DesignTokens.spaceS12,
            ),
        content = content,
    )
}

package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import dev.groupplanning.android.ui.theme.DesignTokens

internal val LocalMobileSheet = staticCompositionLocalOf { false }

@Composable
internal fun MobileField(
    value: String,
    change: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    error: Boolean = false,
    singleLine: Boolean = false,
) {
    val shape = RoundedCornerShape(DesignTokens.componentMobileFieldRadius)
    val inputStyle = TextStyle(
        color = DesignTokens.colorText,
        fontSize = DesignTokens.typographySizeBody,
        lineHeight = DesignTokens.typographySizeBody *
            DesignTokens.typographyLineHeightMobileFieldDescription,
    )
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFieldGap)) {
        Text(label, color = DesignTokens.colorMuted, fontSize = DesignTokens.typographySizeCaption)
        BasicTextField(
            value,
            change,
            modifier.fillMaxWidth().heightIn(
                min = if (singleLine) {
                    DesignTokens.targetAndroid
                } else {
                    DesignTokens.componentMobileFieldTextAreaMinimumHeight
                },
            ).background(DesignTokens.colorBackground, shape).border(
                DesignTokens.spaceS1,
                if (error) DesignTokens.colorError else DesignTokens.colorBorderStrong,
                shape,
            ).padding(
                horizontal = DesignTokens.componentMobileFieldInsetInline,
                vertical = DesignTokens.componentMobileFieldInsetBlock,
            ),
            enabled = enabled,
            singleLine = singleLine,
            textStyle = inputStyle,
            cursorBrush = SolidColor(DesignTokens.colorAccent),
            decorationBox = { input ->
                Box {
                    if (value.isEmpty()) {
                        Text(
                            placeholder,
                            color = DesignTokens.colorMuted,
                            style = inputStyle,
                        )
                    }
                    input()
                }
            },
        )
    }
}

package dev.groupplanning.android.ui.service

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.RequiredFieldLabel
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportField(
    value: String,
    change: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    invalid: Boolean = false,
    singleLine: Boolean = false,
    required: Boolean = false,
) {
    val shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius)
    val style = TextStyle(
        color = Palette.text,
        fontSize = DesignTokens.typographySizeMobileWebInput,
        lineHeight = DesignTokens.componentMobileServiceFieldLineHeight.value.sp,
    )
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10)) {
        RequiredFieldLabel(
            label,
            required,
            fontSize = DesignTokens.typographySizeSmall,
            lineHeight = DesignTokens.componentMobileServiceLabelLineHeight.value.sp,
        )
        BasicTextField(
            value,
            change,
            modifier.fillMaxWidth().heightIn(
                min = if (singleLine) {
                    DesignTokens.componentMobileServiceFieldHeight
                } else {
                    DesignTokens.componentMobileSupportTextareaMinimumHeight
                },
            ).background(Palette.surface, shape).border(
                DesignTokens.spaceS1,
                if (invalid) Palette.error else DesignTokens.colorBorderStrong,
                shape,
            )
                .padding(
                    horizontal = (DesignTokens.spaceS12 + DesignTokens.spaceS2),
                    vertical = DesignTokens.spaceS12,
                ),
            enabled = enabled,
            singleLine = singleLine,
            textStyle = style,
            cursorBrush = SolidColor(Palette.accent),
            decorationBox = { inner ->
                Box {
                    if (value.isEmpty()) Text(placeholder, color = Palette.muted, style = style)
                    inner()
                }
            },
        )
    }
}

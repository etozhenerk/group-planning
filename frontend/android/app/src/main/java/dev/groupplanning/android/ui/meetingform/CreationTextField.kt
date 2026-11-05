package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.RequiredFieldLabel
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreationTextField(
    label: String,
    value: String,
    placeholder: String,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    minLines: Int = 1,
    required: Boolean = false,
    errorText: String? = null,
    labelSize: TextUnit = DesignTokens.componentMobileCreationLabelSize.value.sp,
    cornerRadius: Dp = DesignTokens.componentMobileCreationFieldRadius,
    minimumHeight: Dp = if (minLines > 1) {
        DesignTokens.spaceS40 * 2
    } else {
        DesignTokens.componentMobileCreationFieldHeight
    },
    change: (String) -> Unit,
) {
    val bring = remember { BringIntoViewRequester() }
    var focused by remember { mutableStateOf(false) }
    val keyboardBottom = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(focused, errorText, keyboardBottom) {
        if (focused) bring.bringIntoView()
    }
    val requiredHint = stringResource(R.string.required_field_hint)
    val shape = RoundedCornerShape(cornerRadius)
    val style =
        TextStyle(
            color = DesignTokens.colorText,
            fontSize = DesignTokens.typographySizeBody,
            lineHeight = DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
        )
    Column(
        Modifier.bringIntoViewRequester(bring),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
    ) {
        RequiredFieldLabel(
            label,
            required,
            fontSize = labelSize,
            color = DesignTokens.colorText,
            fontWeight = FontWeight.Medium,
        )
        BasicTextField(
            value,
            change,
            modifier.onFocusChanged { focused = it.isFocused }.fillMaxWidth().heightIn(
                min = minimumHeight,
            )
                .background(
                    if (errorText !=
                        null
                    ) {
                        lerp(
                            DesignTokens.colorNavigation,
                            DesignTokens.colorError,
                            DesignTokens.componentMobileCreationInvalidBackgroundMix.toFloat(),
                        )
                    } else {
                        DesignTokens.colorNavigation
                    },
                    shape,
                )
                .drawBehind {
                    if (errorText != null) {
                        drawRoundRect(
                            DesignTokens.colorError.copy(
                                alpha = DesignTokens.componentMobileCreationInvalidRingOpacity,
                            ),
                            cornerRadius = CornerRadius(
                                cornerRadius.toPx(),
                            ),
                            style = Stroke(
                                DesignTokens.componentMobileCreationInvalidRingWidth.toPx() * 2,
                            ),
                        )
                    }
                }
                .border(
                    DesignTokens.spaceS1,
                    if (errorText !=
                        null
                    ) {
                        lerp(
                            DesignTokens.colorBorderStrong,
                            DesignTokens.colorError,
                            DesignTokens.componentMobileCreationInvalidBorderMix.toFloat(),
                        )
                    } else {
                        DesignTokens.colorBorderStrong
                    },
                    shape,
                )
                .padding(
                    vertical = DesignTokens.spaceS12,
                    horizontal =
                    DesignTokens.spaceS12 + DesignTokens.spaceS2,
                )
                .semantics {
                    contentDescription = label
                    if (required) stateDescription = requiredHint
                    if (errorText != null) error(errorText)
                },
            enabled = enabled,
            singleLine = minLines == 1,
            textStyle = style,
            cursorBrush = SolidColor(DesignTokens.colorAccent),
            decorationBox = { input ->
                Box {
                    if (value.isEmpty()) {
                        Text(
                            placeholder,
                            style = style,
                            color = DesignTokens.colorMuted,
                        )
                    }
                    input()
                }
            },
        )
        if (errorText != null) CreationFieldHint(errorText)
    }
}

package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.LocalMobileSheet
import dev.groupplanning.android.ui.components.RequiredFieldLabel
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DateTimeField(
    label: String,
    value: String,
    icon: Int,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    required: Boolean = false,
    creation: Boolean = false,
    errorText: String? = null,
    controlModifier: Modifier = Modifier,
    open: () -> Unit,
) {
    val requiredHint = stringResource(R.string.required_field_hint)
    val compact = LocalMobileSheet.current
    Column(
        modifier,
        verticalArrangement = Arrangement.spacedBy(
            if (compact) DesignTokens.componentMobileFieldGap else DesignTokens.spaceS8,
        ),
    ) {
        RequiredFieldLabel(
            label,
            required,
            fontSize = if (creation) {
                DesignTokens.componentMobileCreationLabelSize.value.sp
            } else {
                DesignTokens.typographySizeCaption
            },
            color = if (creation) DesignTokens.colorText else DesignTokens.colorMuted,
        )
        Surface(
            open,
            controlModifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid).semantics {
                contentDescription = label
                if (required) stateDescription = requiredHint
            },
            enabled = enabled,
            color = if (compact) DesignTokens.colorBackground else DesignTokens.colorNavigation,
            shape = RoundedCornerShape(
                if (creation) {
                    DesignTokens.componentMobileCreationFieldRadius
                } else if (compact) {
                    DesignTokens.componentMobileFieldRadius
                } else {
                    DesignTokens.radiusControl
                },
            ),
            border = BorderStroke(
                DesignTokens.spaceS1,
                if (errorText !=
                    null
                ) {
                    lerp(
                        DesignTokens.colorBorderStrong,
                        DesignTokens.colorError,
                        DesignTokens.componentMobileCreationInvalidBorderMix.toFloat(),
                    )
                } else if (compact ||
                    creation
                ) {
                    DesignTokens.colorBorderStrong
                } else {
                    DesignTokens.colorFieldBorder
                },
            ),
        ) {
            Row(
                Modifier.padding(
                    horizontal = DesignTokens.componentMobileFieldInsetInline,
                    vertical = DesignTokens.componentMobileFieldInsetBlock,
                ),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    value,
                    Modifier.weight(1f),
                    fontSize = if (compact) {
                        DesignTokens.typographySizeButton
                    } else {
                        DesignTokens.typographySizeSmall
                    },
                    lineHeight = 20.sp,
                    maxLines = if (compact || creation) Int.MAX_VALUE else 1,
                    color = Palette.text,
                )
                val symbol = when (icon) {
                    R.drawable.ic_calendar -> ChatSymbol.Calendar
                    R.drawable.ic_clock -> ChatSymbol.Clock
                    else -> null
                }
                if (compact && symbol != null) {
                    ChatIcon(symbol, Modifier.size(DesignTokens.componentMobileFieldIconSize))
                } else {
                    AppIcon(icon, Modifier.size(DesignTokens.componentMobileFieldIconSize))
                }
            }
        }
        if (errorText != null) CreationFieldHint(errorText)
    }
}

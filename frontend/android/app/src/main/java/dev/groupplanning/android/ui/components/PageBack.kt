package dev.groupplanning.android.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PageBack(
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    close: () -> Unit,
) {
    val description = label ?: stringResource(R.string.experience_back)
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(DesignTokens.componentMobileBackFocusRadius)
    val opacity = when {
        !enabled -> DesignTokens.componentMobileBackDisabledOpacity
        pressed -> DesignTokens.componentMobileBackPressedOpacity
        else -> 1f
    }
    Box(
        modifier.size(DesignTokens.targetAndroid).alpha(opacity).clip(shape)
            .border(
                DesignTokens.spaceS2,
                if (focused) DesignTokens.colorAccent else Color.Transparent,
                shape,
            )
            .clickable(
                enabled = enabled,
                role = Role.Button,
                interactionSource = interaction,
                indication = null,
                onClick = close,
            )
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        AppIcon(
            R.drawable.ic_back,
            Modifier.size(DesignTokens.componentMobileBackIconSize),
            DesignTokens.colorText,
        )
    }
}

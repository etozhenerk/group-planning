package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportDiagnostics(checked: Boolean, enabled: Boolean, change: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = DesignTokens.componentMobileSupportSwitchRowHeight)
            .toggleable(checked, enabled = enabled, role = Role.Switch, onValueChange = change),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
    ) {
        Column(
            Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
        ) {
            Text(
                stringResource(R.string.support_device_data),
                fontSize = DesignTokens.typographySizeSmall,
                fontWeight = FontWeight.Medium,
            )
            Text(
                stringResource(R.string.support_device_hint),
                fontSize = DesignTokens.typographySizeLabel,
                lineHeight = DesignTokens.componentMobileServiceHintLineHeight.value.sp,
                color = Palette.muted,
            )
        }
        Box(Modifier.size(DesignTokens.targetAndroid), contentAlignment = Alignment.Center) {
            Box(
                Modifier.size(
                    DesignTokens.componentMobileSupportSwitchWidth,
                    DesignTokens.componentMobileSupportSwitchHeight,
                )
                    .background(
                        if (checked) Palette.accent else DesignTokens.colorBorderStrong,
                        RoundedCornerShape(DesignTokens.spaceS20),
                    ),
            ) {
                Box(
                    Modifier.padding(
                        start = DesignTokens.spaceS3 +
                            if (checked) {
                                DesignTokens.componentMobileSupportSwitchTravel
                            } else {
                                DesignTokens.spaceS0
                            },
                        top = DesignTokens.spaceS3,
                    ).size(DesignTokens.componentMobileSupportSwitchThumb)
                        .background(
                            if (checked) Palette.background else Palette.text,
                            androidx.compose.foundation.shape.CircleShape,
                        ),
                )
            }
        }
    }
}

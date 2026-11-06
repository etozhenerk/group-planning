package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileLoadState(loading: Boolean, retry: () -> Unit) {
    if (loading) {
        Row(
            Modifier.fillMaxWidth().padding(
                top = DesignTokens.componentMobileProfileIdentityTop,
                bottom = DesignTokens.componentMobileProfileIdentityBottom,
            ),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20),
        ) {
            Box(
                Modifier.size(DesignTokens.componentMobileProfileAvatarSize)
                    .background(
                        Palette.surface,
                        RoundedCornerShape(DesignTokens.componentMobileProfileAvatarRadius),
                    ),
            )
            Column(
                Modifier.weight(1f).padding(top = DesignTokens.spaceS20),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            ) {
                Box(
                    Modifier.fillMaxWidth().height(DesignTokens.spaceS16 + DesignTokens.spaceS2)
                        .background(Palette.surface, RoundedCornerShape(DesignTokens.spaceS6)),
                )
                Box(
                    Modifier.fillMaxWidth(.75f).height(DesignTokens.spaceS12)
                        .background(Palette.surface, RoundedCornerShape(DesignTokens.spaceS6)),
                )
            }
        }
    } else {
        Column(
            Modifier.fillMaxWidth().padding(
                top = DesignTokens.componentMobileProfileMenuGap,
                bottom = DesignTokens.spaceS12,
            ).background(Palette.surface, RoundedCornerShape(DesignTokens.spaceS20))
                .padding(DesignTokens.spaceS24),
        ) {
            AppIcon(
                R.drawable.ic_profile,
                Modifier.padding(
                    bottom =
                    DesignTokens.spaceS16 + DesignTokens.spaceS2,
                )
                    .size(DesignTokens.componentMobileProfileErrorIcon),
                Palette.accent,
            )
            Text(
                stringResource(R.string.profile_load_title),
                fontSize = DesignTokens.componentMobileServiceSectionTitleSize.value.sp,
                lineHeight = DesignTokens.componentMobileServiceSectionTitleLineHeight.value.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                stringResource(R.string.profile_load_body),
                Modifier.widthIn(max = DesignTokens.componentMobileProfileErrorBodyMaximumWidth)
                    .padding(
                        top = DesignTokens.spaceS8,
                        bottom =
                        DesignTokens.spaceS16 + DesignTokens.spaceS2,
                    ),
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight = DesignTokens.componentMobileServiceBodyLineHeight.value.sp,
                color = Palette.muted,
            )
            Surface(
                onClick = retry,
                color = Palette.action,
                contentColor = Palette.actionText,
                shape = RoundedCornerShape(DesignTokens.radiusControl),
            ) {
                Row(
                    Modifier.heightIn(min = DesignTokens.targetAndroid)
                        .padding(horizontal = DesignTokens.spaceS12 + DesignTokens.spaceS2),
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(
                        ChatSymbol.Refresh,
                        Modifier.size(DesignTokens.componentMobileStateActionIconSize),
                        Palette.actionText,
                    )
                    Text(
                        stringResource(R.string.experience_retry),
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                }
            }
        }
    }
}

package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileIdentity(profile: OwnProfile) {
    Row(
        Modifier.padding(
            top = DesignTokens.componentMobileProfileIdentityTop,
            bottom = DesignTokens.componentMobileProfileIdentityBottom,
        ),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        UserAvatar(
            profile.displayName,
            profile.avatarUrl,
            size = DesignTokens.componentMobileProfileAvatarSize,
            avatarColor = Palette.surface,
            foregroundColor = Palette.muted,
            shape = RoundedCornerShape(DesignTokens.componentMobileProfileAvatarRadius),
        )
        Column(
            Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            Text(
                profile.displayName,
                fontSize = DesignTokens.componentMobileProfileNameSize.value.sp,
                lineHeight = DesignTokens.componentMobileProfileNameLineHeight.value.sp,
                letterSpacing = -DesignTokens.componentMobileProfileNameTracking.value.sp,
                fontWeight = FontWeight(DesignTokens.componentMobileServiceTitleWeight.toInt()),
            )
            Text(
                androidx.compose.ui.res.stringResource(
                    dev.groupplanning.android.R.string.profile_login_provider,
                ),
                fontSize = DesignTokens.typographySizeCaption,
                color = Palette.muted,
                lineHeight = (DesignTokens.spaceS16 + DesignTokens.spaceS2).value.sp,
            )
        }
    }
}

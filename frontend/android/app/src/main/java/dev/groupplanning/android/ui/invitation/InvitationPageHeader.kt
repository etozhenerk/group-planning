package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.brand.BrandWordmark
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationPageHeader(profile: UserProfile?, close: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(
            horizontal = DesignTokens.spaceS20,
            vertical = DesignTokens.spaceS12,
        ),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandWordmark(compact = true)
        Spacer(Modifier.weight(1f))
        profile?.let { UserAvatar(it.displayName, it.avatarUrl) }
        IconButton(close, Modifier.size(DesignTokens.targetAndroid)) {
            Icon(
                painterResource(R.drawable.ic_close),
                stringResource(R.string.close_invitation),
                Modifier.size(DesignTokens.componentMobileBackIconSize),
                tint = DesignTokens.colorText,
            )
        }
    }
}

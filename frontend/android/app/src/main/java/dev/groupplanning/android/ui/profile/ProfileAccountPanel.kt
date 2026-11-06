package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileAccountPanel(profile: OwnProfile, close: () -> Unit) {
    ActionSheet(
        stringResource(R.string.profile_account_data),
        close,
        modifier = Modifier.testTag("profile-account-sheet"),
        animateClose = true,
    ) {
        Column(Modifier.fillMaxWidth().padding(bottom = DesignTokens.spaceS12)) {
            Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
                AppIcon(R.drawable.ic_lock, Modifier.size(DesignTokens.spaceS16), Palette.accent)
                Text(
                    stringResource(R.string.profile_data_private),
                    fontSize = DesignTokens.typographySizeCaption,
                    color = Palette.accent,
                )
            }
            Text(
                stringResource(R.string.profile_data_source),
                Modifier.padding(top = DesignTokens.spaceS8, bottom = DesignTokens.spaceS4),
                fontSize = DesignTokens.typographySizeCaption,
                color = Palette.muted,
            )
            Text(
                stringResource(R.string.profile_contact_group),
                Modifier.padding(top = DesignTokens.spaceS24, bottom = DesignTokens.spaceS2),
                fontSize = DesignTokens.typographySizeCaption,
                fontWeight = FontWeight.SemiBold,
                color = Palette.muted,
            )
            ProfileDataRow(
                R.string.profile_email,
                profile.email ?: stringResource(R.string.profile_email_missing),
            )
            ProfileDataRow(
                R.string.profile_phone,
                profile.phone ?: stringResource(R.string.profile_missing),
                last = true,
            )
            Text(
                stringResource(R.string.profile_personal_readonly),
                Modifier.padding(top = DesignTokens.spaceS24, bottom = DesignTokens.spaceS2),
                fontSize = DesignTokens.typographySizeCaption,
                fontWeight = FontWeight.SemiBold,
                color = Palette.muted,
            )
            ProfilePersonal(profile)
        }
    }
}

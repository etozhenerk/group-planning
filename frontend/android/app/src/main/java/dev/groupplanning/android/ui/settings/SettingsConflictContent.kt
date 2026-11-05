package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.preview
import dev.groupplanning.android.state.settings.SettingsState
import dev.groupplanning.android.ui.invitation.MeetingInformationFacts
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun SettingsConflictContent(state: SettingsState) {
    if (state.busy) CircularProgressIndicator()
    state.latest?.let { meeting ->
        val density = LocalDensity.current
        Column {
            Text(
                stringResource(R.string.settings_current_facts),
                Modifier.padding(top = DesignTokens.spaceS12, bottom = DesignTokens.spaceS8),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
                fontWeight = FontWeight.Medium,
            )
            Text(
                meeting.title,
                Modifier.padding(bottom = DesignTokens.spaceS24),
                fontSize = with(density) {
                    DesignTokens.componentMobileSettingsReviewTitleSize.toSp()
                },
                lineHeight = with(density) {
                    DesignTokens.componentMobileSettingsReviewTitleLineHeight.toSp()
                },
                fontWeight = FontWeight.Bold,
            )
            MeetingInformationFacts(meeting.preview(), card = false)
            Text(
                stringResource(R.string.settings_rebase_explanation),
                Modifier.padding(top = DesignTokens.spaceS24 + DesignTokens.spaceS4),
                color = DesignTokens.colorMuted,
                fontSize = with(density) {
                    DesignTokens.componentMobileSettingsReviewBodySize.toSp()
                },
                lineHeight = with(density) {
                    DesignTokens.componentMobileSettingsReviewBodyLineHeight.toSp()
                },
            )
        }
    }
}

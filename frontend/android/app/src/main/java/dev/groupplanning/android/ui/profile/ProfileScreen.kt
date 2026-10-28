package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.ProfileViewModel
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.ExperienceSkeleton
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.service.ProfileServiceNavigation
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileScreen(
    model: ProfileViewModel,
    service: (String) -> Unit,
    logout: () -> Unit,
) {
    val state by model.state.collectAsStateWithLifecycle()
    LaunchedEffect(model) { model.load() }
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.zIndex(1f).testTag("profile-start")) { MeetingsHeader() }
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(
                start = 20.dp,
                end = 20.dp,
                top = 28.dp,
                bottom = DesignTokens.spaceS24,
            ),
        ) {
            Text(
                stringResource(R.string.profile_heading),
                fontSize = 28.sp,
                lineHeight = 32.2.sp,
                letterSpacing = (-.9).sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 24.dp),
            )
            if (state.loading && state.profile == null) ExperienceSkeleton(profile = true)
            if (state.error) {
                TextButton(model::load) {
                    Text(
                        stringResource(R.string.profile_load_error) + ". " +
                            stringResource(R.string.experience_retry),
                    )
                }
            }
            state.profile?.let { profile ->
                Column(
                    Modifier.fillMaxWidth().background(
                        Palette.surface,
                        RoundedCornerShape(22.dp),
                    ).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        UserAvatar(profile.displayName, profile.avatarUrl, size = 86.dp)
                        Column(Modifier.widthIn(max = 140.dp)) {
                            Text(
                                profile.displayName,
                                fontSize = 22.sp,
                                lineHeight = 27.5.sp,
                                letterSpacing = (-.5).sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                stringResource(R.string.profile_visible_name),
                                fontSize = 12.sp,
                                lineHeight = 18.sp,
                                color = Palette.muted,
                            )
                        }
                    }
                    Box(
                        Modifier.padding(vertical = 20.dp).fillMaxWidth().height(1.dp)
                            .background(Color(0x12ffffff)),
                    )
                    FlowRow(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Column(Modifier.widthIn(min = 200.dp)) {
                            Text(
                                stringResource(R.string.profile_provider),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                stringResource(R.string.profile_provider_hint),
                                fontSize = 12.sp,
                                lineHeight = 18.sp,
                                color = Palette.muted,
                            )
                        }
                        Text(
                            stringResource(R.string.profile_connected),
                            fontSize = 11.sp,
                            color = Palette.muted,
                            modifier = Modifier
                                .background(Color(0x0bffffff), RoundedCornerShape(6.dp))
                                .padding(horizontal = 9.dp, vertical = 4.dp),
                        )
                    }
                }
                ProfilePersonal(profile)
                Text(
                    stringResource(R.string.profile_contacts),
                    fontSize = 12.sp,
                    letterSpacing = .84.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Palette.muted,
                    modifier = Modifier.padding(top = 22.dp, bottom = 12.dp),
                )
                Column(
                    Modifier.fillMaxWidth().background(
                        Palette.surface,
                        RoundedCornerShape(22.dp),
                    ).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    ProfileContact(
                        R.drawable.ic_invitation,
                        R.string.profile_email,
                        profile.email ?: stringResource(R.string.profile_email_missing),
                    )
                    ProfileContact(
                        R.drawable.ic_profile,
                        R.string.profile_phone,
                        profile.phone ?: stringResource(R.string.profile_missing),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                        AppIcon(R.drawable.ic_lock, Modifier.padding(top = 2.dp).size(14.dp))
                        Text(
                            stringResource(R.string.profile_contacts_private),
                            fontSize = 12.sp,
                            lineHeight = 18.sp,
                            color = Palette.muted,
                        )
                    }
                }
            }
            ProfileServiceNavigation(service)
            TextButton(logout, Modifier.fillMaxWidth().padding(top = DesignTokens.spaceS20)) {
                Text(
                    stringResource(R.string.experience_logout),
                    fontSize = DesignTokens.typographySizeButton,
                )
            }
        }
    }
}

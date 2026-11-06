package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.ProfileViewModel
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.service.ProfileServiceNavigation
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileScreen(
    model: ProfileViewModel,
    service: (String) -> Unit,
    logout: () -> Unit,
    logoutBusy: Boolean = false,
    logoutFailed: Boolean = false,
) {
    val state by model.state.collectAsStateWithLifecycle()
    var account by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(model) { model.load() }
    Column(
        Modifier.fillMaxSize().statusBarsPadding().verticalScroll(rememberScrollState())
            .padding(horizontal = DesignTokens.spaceS20)
            .padding(
                top = DesignTokens.componentMobileProfileInsetTop,
                bottom = DesignTokens.spaceS24,
            )
            .testTag("profile-start"),
    ) {
        Text(
            stringResource(R.string.profile_title),
            fontSize = DesignTokens.componentMobileServiceTitleSize.value.sp,
            lineHeight = DesignTokens.componentMobileServiceTitleLineHeight.value.sp,
            letterSpacing = -DesignTokens.componentMobileServiceTitleTracking.value.sp,
            fontWeight = FontWeight(DesignTokens.componentMobileServiceTitleWeight.toInt()),
        )
        if (state.loading && state.profile == null) ProfileLoadState(true, model::load)
        if (state.error) ProfileLoadState(false, model::load)
        state.profile?.let { profile ->
            ProfileIdentity(profile)
            Surface(
                onClick = { account = true },
                color = Palette.surface,
                shape = RoundedCornerShape(DesignTokens.componentMobileProfileAccessRadius),
                modifier = Modifier.fillMaxWidth().testTag("profile-account-data"),
            ) {
                Row(
                    Modifier.padding(
                        horizontal = DesignTokens.spaceS16,
                        vertical = DesignTokens.spaceS20,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.spaceS12 + DesignTokens.spaceS2,
                    ),
                ) {
                    AppIcon(
                        R.drawable.ic_lock,
                        Modifier.size(DesignTokens.componentMobileProfileMenuIcon),
                        Palette.accent,
                    )
                    Column(
                        Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
                    ) {
                        Text(
                            stringResource(R.string.profile_account_data),
                            fontSize = DesignTokens.componentMobileProfileAccessTitleSize.value.sp,
                            lineHeight =
                            DesignTokens.componentMobileProfileAccessTitleLineHeight.value.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            stringResource(R.string.profile_account_hint),
                            fontSize = DesignTokens.typographySizeLabel,
                            lineHeight =
                            DesignTokens.componentMobileProfileAccessHintLineHeight.value.sp,
                            color = Palette.muted,
                        )
                    }
                    ChatIcon(
                        ChatSymbol.Down,
                        Modifier.size(DesignTokens.componentMobileFieldIconSize),
                    )
                }
            }
            if (account) ProfileAccountPanel(profile) { account = false }
        }
        ProfileServiceNavigation(service)
        Column(
            Modifier.fillMaxWidth().padding(top = DesignTokens.componentMobileProfileLogoutGap),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            if (logoutFailed) {
                Text(
                    stringResource(R.string.profile_logout_error),
                    fontSize = DesignTokens.typographySizeCaption,
                    color = Palette.muted,
                )
            }
            Surface(
                onClick = logout,
                enabled = !logoutBusy,
                color = Palette.background,
                border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
                shape = RoundedCornerShape(DesignTokens.componentMobileServiceActionRadius),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    Modifier.fillMaxWidth().heightIn(
                        min = DesignTokens.componentMobileServiceActionHeight,
                    ).padding(DesignTokens.spaceS12),
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.spaceS10,
                        Alignment.CenterHorizontally,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(ChatSymbol.Logout, Modifier.size(DesignTokens.spaceS20))
                    Text(
                        stringResource(
                            if (logoutBusy) {
                                R.string.profile_logging_out
                            } else {
                                R.string.profile_logout
                            },
                        ),
                        fontSize = DesignTokens.typographySizeSmall,
                        lineHeight = DesignTokens.componentMobileProfileLogoutLineHeight.value.sp,
                        color = Palette.muted,
                    )
                }
            }
        }
    }
}

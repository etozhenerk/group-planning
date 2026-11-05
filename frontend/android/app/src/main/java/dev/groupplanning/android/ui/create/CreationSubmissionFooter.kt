package dev.groupplanning.android.ui.create

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.DpOffset
import dev.groupplanning.android.R
import dev.groupplanning.android.state.CreationState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreationSubmissionFooter(state: CreationState, submit: () -> Unit) {
    val shape = RoundedCornerShape(
        topStart = DesignTokens.componentMobileStickyRadius,
        topEnd = DesignTokens.componentMobileStickyRadius,
    )
    Column(
        Modifier.fillMaxWidth().dropShadow(
            shape,
            Shadow(
                radius = DesignTokens.componentMobileStickyShadowBlur,
                color = DesignTokens.colorMobileStickyShadow,
                offset = DpOffset(
                    DesignTokens.spaceS0,
                    -DesignTokens.componentMobileStickyShadowUpOffset,
                ),
            ),
        ).background(DesignTokens.colorSurface, shape)
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom))
            .padding(horizontal = DesignTokens.componentMobileStickyInsetInline)
            .padding(
                top = DesignTokens.componentMobileStickyInsetTop,
                bottom = DesignTokens.spaceS6,
            ),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
    ) {
        (state.problem ?: state.warning)?.let { problem ->
            Row(
                Modifier.testTag("create-problem").semantics {
                    liveRegion = LiveRegionMode.Assertive
                },
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentInvitationNoticeGap,
                ),
            ) {
                ChatIcon(
                    ChatSymbol.Alert,
                    Modifier.background(
                        DesignTokens.colorInvitationNoticeBackground,
                        RoundedCornerShape(DesignTokens.componentInvitationNoticeIconRadius),
                    )
                        .padding(
                            DesignTokens.spaceS8,
                        ).size(DesignTokens.componentInvitationNoticeGlyphSize),
                    tint = DesignTokens.colorError,
                )
                Column(
                    Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(
                        DesignTokens.componentInvitationNoticeCopyGap,
                    ),
                ) {
                    Text(
                        stringResource(
                            if (state.frozen) {
                                R.string.create_unknown_title
                            } else {
                                R.string.create_failed_title
                            },
                        ),
                        fontSize = DesignTokens.typographySizeSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        if (state.frozen) stringResource(R.string.create_unknown_hint) else problem,
                        fontSize = DesignTokens.typographySizeCaption,
                        color = DesignTokens.colorMuted,
                    )
                }
            }
        }
        CompactButton(
            stringResource(
                when {
                    state.frozen -> R.string.create_send_again
                    state.problem != null -> R.string.create_try_again
                    else -> R.string.meetings_create_accessible
                },
            ),
            Modifier.fillMaxWidth().testTag("create-submit"),
            primary = true,
            enabled = !state.preparingCover,
            busy = state.busy,
            click = submit,
        )
    }
}

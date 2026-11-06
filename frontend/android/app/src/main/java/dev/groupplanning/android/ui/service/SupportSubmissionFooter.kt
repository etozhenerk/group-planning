package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.DpOffset
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportSubmissionFooter(
    busy: Boolean,
    error: Boolean,
    frozen: Boolean,
    enabled: Boolean,
    pinned: Boolean,
    modifier: Modifier = Modifier,
    submit: () -> Unit,
) {
    val shape = RoundedCornerShape(
        topStart = DesignTokens.componentMobileStickyRadius,
        topEnd = DesignTokens.componentMobileStickyRadius,
    )
    Column(
        modifier.fillMaxWidth().then(
            if (pinned) {
                Modifier
                    .dropShadow(
                        shape,
                        Shadow(
                            radius = DesignTokens.componentMobileStickyShadowBlur,
                            color = DesignTokens.colorMobileStickyShadow,
                            offset = DpOffset(
                                DesignTokens.spaceS0,
                                -DesignTokens.componentMobileStickyShadowUpOffset,
                            ),
                        ),
                    )
                    .background(Palette.surface, shape)
            } else {
                Modifier
            },
        )
            .padding(horizontal = DesignTokens.spaceS20)
            .padding(
                top = DesignTokens.spaceS16,
                bottom = DesignTokens.spaceS24 + DesignTokens.spaceS4,
            ),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
    ) {
        if (error) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                verticalAlignment = Alignment.Top,
            ) {
                ServiceIcon(
                    ChatSymbol.Alert,
                    (DesignTokens.spaceS16 + DesignTokens.spaceS2),
                    Palette.error,
                )
                Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4)) {
                    Text(
                        stringResource(
                            if (frozen) R.string.support_unknown else R.string.support_failed,
                        ),
                        fontSize = DesignTokens.typographySizeSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        stringResource(R.string.support_retry_hint),
                        fontSize = DesignTokens.typographySizeLabel,
                        color = Palette.muted,
                    )
                }
            }
        }
        ServiceActionButton(
            stringResource(
                if (busy) {
                    R.string.support_sending
                } else if (error) {
                    R.string.support_retry
                } else {
                    R.string.support_send_new
                },
            ),
            Modifier.fillMaxWidth(),
            busy = busy,
            enabled = enabled,
            click = submit,
        )
    }
}

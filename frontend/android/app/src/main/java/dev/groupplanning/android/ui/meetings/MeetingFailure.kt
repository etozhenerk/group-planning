package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingFailure(title: String, refresh: Boolean, retry: () -> Unit) {
    val action = stringResource(
        if (refresh) R.string.meetings_retry_refresh else R.string.meetings_retry_load,
    )
    val shape = RoundedCornerShape(
        if (refresh) DesignTokens.componentMobileStateRefreshRadius else DesignTokens.radiusCard,
    )
    Surface(
        Modifier.fillMaxWidth().padding(
            top = if (refresh) DesignTokens.spaceS0 else DesignTokens.spaceS24,
            bottom = if (refresh) DesignTokens.spaceS20 else DesignTokens.spaceS0,
        ).testTag("meetings-error"),
        shape = shape,
        color = Palette.surface,
        border = if (refresh) null else BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
    ) {
        if (refresh) {
            Row(
                Modifier.padding(DesignTokens.spaceS8).padding(start = DesignTokens.spaceS6),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
            ) {
                ChatIcon(
                    ChatSymbol.CloudOff,
                    Modifier.size(DesignTokens.componentMobileStateRefreshGlyphSize),
                )
                Text(
                    title,
                    Modifier.weight(1f),
                    color = Palette.muted,
                    fontSize = DesignTokens.typographySizeCaption,
                )
                Surface(
                    onClick = retry,
                    modifier = Modifier.size(DesignTokens.targetAndroid)
                        .semantics { contentDescription = action },
                    color = Palette.surface,
                    shape = RoundedCornerShape(
                        DesignTokens.componentMobileStateRefreshActionRadius,
                    ),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        ChatIcon(
                            ChatSymbol.Refresh,
                            Modifier.size(DesignTokens.componentMobileStateRefreshActionGlyphSize),
                        )
                    }
                }
            }
        } else {
            Column(
                Modifier.padding(
                    vertical = DesignTokens.spaceS32,
                    horizontal = DesignTokens.spaceS24,
                ),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(DesignTokens.componentMobileStateLargeIconSize).background(
                        Palette.background,
                        RoundedCornerShape(DesignTokens.componentMobileStateLargeIconRadius),
                    ),
                    contentAlignment = Alignment.Center,
                ) {
                    ChatIcon(
                        ChatSymbol.CloudOff,
                        Modifier.size(DesignTokens.componentMobileStateLargeGlyphSize),
                        strokeWidth = DesignTokens.componentMobileStateGlyphStroke,
                    )
                }
                Text(
                    title,
                    Modifier.padding(
                        top = DesignTokens.componentMobileStateLargeIconGap,
                        bottom = DesignTokens.spaceS24,
                    ),
                    fontSize = DesignTokens.componentMobileStateTitleSize.value.sp,
                    fontWeight = FontWeight(DesignTokens.componentMobileStateTitleWeight.toInt()),
                    textAlign = TextAlign.Center,
                )
                Surface(
                    onClick = retry,
                    color = Palette.action,
                    contentColor = Palette.actionText,
                    shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
                ) {
                    Row(
                        Modifier.fillMaxWidth().heightIn(
                            min = DesignTokens.componentMobileStateActionMinimumHeight,
                        ).padding(horizontal = DesignTokens.spaceS12),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(
                            DesignTokens.spaceS8,
                            Alignment.CenterHorizontally,
                        ),
                    ) {
                        ChatIcon(
                            ChatSymbol.Refresh,
                            Modifier.size(DesignTokens.componentMobileStateActionIconSize),
                            tint = Palette.actionText,
                        )
                        Text(
                            action,
                            fontSize = DesignTokens.typographySizeSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }
    }
}

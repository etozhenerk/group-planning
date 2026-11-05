package dev.groupplanning.android.ui.components

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
internal fun MobileStatus(
    title: String,
    refresh: Boolean,
    retry: () -> Unit,
    large: Boolean = true,
    symbol: ChatSymbol = ChatSymbol.CloudOff,
    actionLabel: String? = null,
    actionSymbol: ChatSymbol? = ChatSymbol.Refresh,
) {
    val iconSize = if (large) {
        DesignTokens.componentMobileStateLargeIconSize
    } else {
        DesignTokens.componentMobileStateIconSize
    }
    val iconRadius = if (large) {
        DesignTokens.componentMobileStateLargeIconRadius
    } else {
        DesignTokens.componentMobileStateIconRadius
    }
    val glyphSize = if (large) {
        DesignTokens.componentMobileStateLargeGlyphSize
    } else {
        DesignTokens.componentMobileStateGlyphSize
    }
    val titleSize = if (large) {
        DesignTokens.componentMobileStateTitleSize
    } else {
        DesignTokens.componentMobileStateCompactTitleSize
    }
    val action = actionLabel ?: stringResource(
        if (refresh) R.string.meetings_retry_refresh else R.string.meetings_retry_load,
    )
    val shape = RoundedCornerShape(
        if (refresh) DesignTokens.componentMobileStateRefreshRadius else DesignTokens.radiusCard,
    )
    Surface(
        Modifier.fillMaxWidth().padding(
            top = if (refresh) {
                DesignTokens.spaceS0
            } else if (large) {
                DesignTokens.spaceS24
            } else {
                DesignTokens.spaceS20
            },
            bottom = if (refresh) DesignTokens.spaceS20 else DesignTokens.spaceS0,
        ).testTag("mobile-status"),
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
                    symbol,
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
                    color = DesignTokens.colorRaised,
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
                    vertical = if (large) {
                        DesignTokens.spaceS32
                    } else {
                        DesignTokens.componentMobileStatePanelInsetBlock
                    },
                    horizontal = if (large) {
                        DesignTokens.spaceS24
                    } else {
                        DesignTokens.componentMobileStatePanelInsetInline
                    },
                ),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(iconSize).background(
                        Palette.background,
                        RoundedCornerShape(iconRadius),
                    ),
                    contentAlignment = Alignment.Center,
                ) {
                    ChatIcon(
                        symbol,
                        Modifier.size(glyphSize),
                        tint = if (large) Palette.muted else Palette.accent,
                        strokeWidth = DesignTokens.componentMobileStateGlyphStroke,
                    )
                }
                Text(
                    title,
                    Modifier.padding(
                        top = if (large) {
                            DesignTokens.componentMobileStateLargeIconGap
                        } else {
                            DesignTokens.spaceS20
                        },
                        bottom = DesignTokens.spaceS24,
                    ),
                    fontSize = titleSize.value.sp,
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
                        actionSymbol?.let {
                            ChatIcon(
                                it,
                                Modifier.size(DesignTokens.componentMobileStateActionIconSize),
                                tint = Palette.actionText,
                            )
                        }
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

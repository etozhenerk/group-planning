package dev.groupplanning.android.ui.service

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ScreenSelector(value: String, enabled: Boolean, change: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    var opened by remember { mutableStateOf(false) }
    val triggerFocus = remember { FocusRequester() }
    LaunchedEffect(expanded) { if (!expanded && opened) triggerFocus.requestFocus() }
    val screens = listOf(
        "meetings" to R.string.screen_meetings,
        "calendar" to R.string.screen_calendar,
        "invitation" to R.string.screen_invitation,
        "meeting_chat" to R.string.screen_chat,
        "profile" to R.string.screen_profile,
        "memories" to R.string.screen_memories,
        "sign_in" to R.string.screen_signin,
        "other" to R.string.screen_other,
    )
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10)) {
        Text(
            stringResource(R.string.support_screen_title),
            fontSize = DesignTokens.typographySizeSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Surface(
            {
                opened = true
                expanded = true
            },
            enabled = enabled,
            modifier = Modifier.fillMaxWidth().focusRequester(
                triggerFocus,
            ).testTag("support-section-trigger"),
            color = Palette.surface,
            shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius),
            border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
        ) {
            Row(
                Modifier.heightIn(min = DesignTokens.componentMobileServiceFieldHeight)
                    .padding(horizontal = (DesignTokens.spaceS12 + DesignTokens.spaceS2)),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    stringResource(screens.first { it.first == value }.second),
                    fontSize = DesignTokens.typographySizeMobileWebInput,
                )
                ServiceIcon(
                    ChatSymbol.Down,
                    (DesignTokens.spaceS16 + DesignTokens.spaceS2),
                    Palette.muted,
                )
            }
        }
    }
    if (expanded) {
        ActionSheet(
            stringResource(R.string.support_screen_title),
            { expanded = false },
            modifier = Modifier.testTag("support-section-sheet"),
            animateClose = true,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4)) {
                screens.forEach { (key, label) ->
                    Surface(
                        {
                            change(key)
                            expanded = false
                        },
                        Modifier.fillMaxWidth().semantics {
                            selected = key == value
                            role = Role.RadioButton
                        },
                        color = if (key == value) Palette.background else Palette.surface,
                        shape = RoundedCornerShape(DesignTokens.spaceS12),
                    ) {
                        Row(
                            Modifier.heightIn(
                                min = DesignTokens.componentMobileSupportSectionOptionHeight,
                            )
                                .padding(
                                    horizontal = (DesignTokens.spaceS12 + DesignTokens.spaceS2),
                                ),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                stringResource(label),
                                Modifier.weight(1f),
                                fontSize =
                                DesignTokens.componentMobileSupportSectionOptionSize.value.sp,
                                lineHeight =
                                DesignTokens.componentMobileSupportSectionOptionLineHeight
                                    .value.sp,
                                fontWeight = if (key ==
                                    value
                                ) {
                                    FontWeight.SemiBold
                                } else {
                                    FontWeight.Normal
                                },
                            )
                            if (key ==
                                value
                            ) {
                                ServiceIcon(ChatSymbol.Check, DesignTokens.spaceS20, Palette.accent)
                            }
                        }
                    }
                }
            }
        }
    }
}

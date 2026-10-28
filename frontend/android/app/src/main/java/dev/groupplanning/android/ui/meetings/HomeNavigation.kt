package dev.groupplanning.android.ui.meetings

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun HomeNavigation(selected: Int, select: (Int) -> Unit) {
    BoxWithConstraints(
        Modifier.testTag("home-navigation").padding(horizontal = 16.dp).fillMaxWidth().height(62.dp)
            .shadow(12.dp, RoundedCornerShape(31.dp))
            .clip(RoundedCornerShape(31.dp)).background(Color(0xfa27282e))
            .border(1.dp, Color(0x15ffffff), RoundedCornerShape(31.dp))
            .padding(6.dp).selectableGroup(),
    ) {
        val width = maxWidth / 3
        val x by animateDpAsState(
            width * selected,
            tween(
                if (LocalMotionEnabled.current) {
                    DesignTokens.motionDurationNavigation
                } else {
                    0
                },
            ),
            label = "navigation",
        )
        Box(
            Modifier.offset { IntOffset(x.roundToPx(), 0) }
                .width(width).height(DesignTokens.spaceS48)
                .background(
                    DesignTokens.colorNavigationSelected,
                    RoundedCornerShape(DesignTokens.radiusPill),
                )
                .border(
                    DesignTokens.spaceS1,
                    DesignTokens.colorNavigationSelectedBorder,
                    RoundedCornerShape(DesignTokens.radiusPill),
                ),
        )
        Row(Modifier.fillMaxWidth()) {
            listOf(R.string.home_meetings, R.string.home_invitations, R.string.profile_title)
                .forEachIndexed { index, label ->
                    val tint by animateColorAsState(
                        if (selected ==
                            index
                        ) {
                            DesignTokens.colorNavigationSelectedText
                        } else {
                            Palette.muted
                        },
                        tween(
                            if (LocalMotionEnabled.current) {
                                DesignTokens.motionDurationNavigation
                            } else {
                                0
                            },
                        ),
                        label = "navigation-color-$index",
                    )
                    Column(
                        Modifier.weight(
                            1f,
                        ).height(DesignTokens.spaceS48)
                            .clip(RoundedCornerShape(DesignTokens.radiusPill))
                            .selectable(selected == index, role = Role.Tab, onClick = {
                                select(index)
                            })
                            .testTag(
                                listOf("home-meetings", "home-invitations", "home-profile")[index],
                            ),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(
                            3.dp,
                            Alignment.CenterVertically,
                        ),
                    ) {
                        AppIcon(
                            listOf(
                                R.drawable.ic_calendar,
                                R.drawable.ic_invitation,
                                R.drawable.ic_profile,
                            )[index],
                            Modifier.size(19.dp),
                            tint,
                        )
                        Text(
                            stringResource(label),
                            fontSize = 9.sp,
                            lineHeight = 13.5.sp,
                            letterSpacing = .05.sp,
                            color = tint,
                        )
                    }
                }
        }
    }
}

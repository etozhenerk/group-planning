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
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun HomeNavigation(selected: Int, select: (Int) -> Unit, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(
        topStart = DesignTokens.componentMobileStickyRadius,
        topEnd = DesignTokens.componentMobileStickyRadius,
    )
    val duration = if (LocalMotionEnabled.current) DesignTokens.motionDurationNavigation else 0
    BoxWithConstraints(
        modifier.fillMaxWidth().testTag("home-navigation")
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
            .background(DesignTokens.colorMobileNavigationAndroidBackground, shape)
            .border(DesignTokens.spaceS1, DesignTokens.colorMobileNavigationAndroidBorder, shape)
            .windowInsetsPadding(
                WindowInsets.safeDrawing.only(
                    WindowInsetsSides.Horizontal + WindowInsetsSides.Bottom,
                ),
            )
            .padding(DesignTokens.componentMobileNavigationPadding).selectableGroup(),
    ) {
        val width = maxWidth / 3
        val labels = listOf(
            R.string.home_meetings,
            R.string.home_invitations,
            R.string.profile_title,
        )
            .map { stringResource(it) }
        val density = LocalDensity.current
        val measurer = rememberTextMeasurer()
        val labelStyle = LocalTextStyle.current.copy(
            fontSize = DesignTokens.typographySizeNavigationLabel,
            letterSpacing = DesignTokens.typographyTrackingNavigationLabel,
        )
        val labelScale = remember(width, labels, density, labelStyle) {
            val available = with(density) { (width - DesignTokens.spaceS1).toPx() }
            val widest = labels.maxOf {
                measurer.measure(it, labelStyle, softWrap = false, maxLines = 1).size.width
            }
            minOf(1f, available / widest.coerceAtLeast(1))
        }
        val x by animateDpAsState(width * selected, tween(duration), label = "navigation")
        Box(Modifier.matchParentSize()) {
            Box(
                Modifier.offset { IntOffset(x.roundToPx(), 0) }.width(width).fillMaxHeight()
                    .background(
                        DesignTokens.colorNavigationSelected,
                        RoundedCornerShape(DesignTokens.radiusSheet),
                    )
                    .border(
                        DesignTokens.spaceS1,
                        DesignTokens.colorNavigationSelectedBorder,
                        RoundedCornerShape(DesignTokens.radiusSheet),
                    ),
            )
        }
        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
            listOf(R.string.home_meetings, R.string.home_invitations, R.string.profile_title)
                .forEachIndexed { index, label ->
                    val tint by animateColorAsState(
                        if (selected == index) {
                            DesignTokens.colorNavigationSelectedText
                        } else {
                            DesignTokens.colorNavigationInactiveText
                        },
                        tween(duration),
                        label = "navigation-color-$index",
                    )
                    Column(
                        Modifier.weight(
                            1f,
                        ).fillMaxHeight().heightIn(min = DesignTokens.targetAndroid)
                            .clip(RoundedCornerShape(DesignTokens.radiusSheet))
                            .selectable(selected == index, role = Role.Tab, onClick = {
                                select(index)
                            })
                            .testTag(
                                listOf("home-meetings", "home-invitations", "home-profile")[index],
                            ),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(
                            DesignTokens.componentMobileNavigationIconGap,
                            Alignment.CenterVertically,
                        ),
                    ) {
                        AppIcon(
                            listOf(
                                R.drawable.ic_calendar,
                                R.drawable.ic_invitation,
                                R.drawable.ic_profile,
                            )[index],
                            Modifier.size(DesignTokens.componentNavigationIcon),
                            tint,
                        )
                        Text(
                            stringResource(label),
                            fontSize = DesignTokens.typographySizeNavigationLabel * labelScale,
                            lineHeight =
                            DesignTokens.componentMobileNavigationAndroidLabelLineHeight.value.sp *
                                labelScale,
                            letterSpacing = DesignTokens.typographyTrackingNavigationLabel,
                            maxLines = 1,
                            softWrap = false,
                            textAlign = TextAlign.Center,
                            color = tint,
                        )
                    }
                }
        }
    }
}

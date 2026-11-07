package dev.groupplanning.android.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DetailsSkeleton(label: String, tag: String = "details-loading") {
    val opacity = if (LocalMotionEnabled.current) {
        val transition = rememberInfiniteTransition(label = "invitation-loading")
        val animated by transition.animateFloat(
            DesignTokens.componentInvitationStateLoadingDimOpacity,
            DesignTokens.componentInvitationStateLoadingBrightOpacity,
            infiniteRepeatable(
                tween(DesignTokens.componentInvitationStateLoadingPulse),
                RepeatMode.Reverse,
            ),
            label = "invitation-loading-opacity",
        )
        animated
    } else {
        1f
    }
    Column(
        Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS12).alpha(opacity)
            .testTag(tag).clearAndSetSemantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentInvitationStateLoadingGap),
    ) {
        LoadingLine(
            DesignTokens.componentInvitationStateLoadingTitleWidth,
            DesignTokens.componentInvitationStateLoadingTitleHeight,
        )
        Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
            LoadingLine(DesignTokens.componentInvitationStateLoadingLineOneWidth)
            LoadingLine(DesignTokens.componentInvitationStateLoadingLineTwoWidth)
        }
        Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
            LoadingLine()
            LoadingLine(DesignTokens.componentInvitationStateLoadingTitleWidth)
        }
        Box(
            Modifier.widthIn(max = DesignTokens.componentInvitationStateLoadingActionWidth)
                .fillMaxWidth().height(DesignTokens.componentInvitationStateLoadingActionHeight)
                .background(
                    DesignTokens.colorLine,
                    RoundedCornerShape(DesignTokens.componentInvitationStateLoadingRadius),
                ),
        )
    }
}

@Composable
private fun LoadingLine(
    fraction: Float = 1f,
    height: Dp = DesignTokens.componentInvitationStateLoadingLineHeight,
) {
    Box(
        Modifier.fillMaxWidth(fraction).height(height).background(
            DesignTokens.colorLine,
            RoundedCornerShape(DesignTokens.componentInvitationStateLoadingRadius),
        ),
    )
}

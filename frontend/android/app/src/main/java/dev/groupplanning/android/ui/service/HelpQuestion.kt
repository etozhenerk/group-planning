package dev.groupplanning.android.ui.service

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun HelpQuestion(title: String, answer: String, expanded: Boolean, toggle: () -> Unit) {
    val motion = LocalMotionEnabled.current
    val easing = remember {
        DesignTokens.motionEasingStandard.let { CubicBezierEasing(it[0], it[1], it[2], it[3]) }
    }
    val heightDuration = if (motion) DesignTokens.motionDurationCard else 0
    val opacityDuration = if (motion) DesignTokens.motionDurationFast else 0
    val state =
        stringResource(if (expanded) R.string.help_answer_open else R.string.help_answer_closed)
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(DesignTokens.componentHelpDisclosureRadius))
            .background(DesignTokens.colorSurface),
    ) {
        Row(
            Modifier.fillMaxWidth().clickable(role = Role.Button, onClick = toggle)
                .semantics {
                    stateDescription = state
                }.padding(DesignTokens.componentHelpDisclosureMobileInset),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS24),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                title,
                Modifier.weight(1f),
                fontSize = DesignTokens.typographySizeHelpQuestion,
                lineHeight =
                DesignTokens.typographySizeHelpQuestion *
                    DesignTokens.typographyLineHeightHelpQuestion,
                fontWeight = FontWeight(DesignTokens.typographyWeightHelpQuestion.toInt()),
            )
            HelpDisclosureIcon(expanded)
        }
        AnimatedVisibility(
            expanded,
            enter = expandVertically(tween(heightDuration, easing = easing), Alignment.Top) +
                fadeIn(tween(opacityDuration)),
            exit = shrinkVertically(tween(heightDuration, easing = easing), Alignment.Top) +
                fadeOut(tween(opacityDuration)),
        ) {
            Text(
                answer,
                Modifier.padding(
                    start = DesignTokens.componentHelpDisclosureMobileInset,
                    end = DesignTokens.componentHelpDisclosureMobileInset,
                    bottom = DesignTokens.componentHelpDisclosureMobileInset,
                )
                    .then(if (expanded) Modifier else Modifier.clearAndSetSemantics { }),
                fontSize = DesignTokens.typographySizeHelpAnswer,
                lineHeight = DesignTokens.typographySizeHelpAnswer *
                    DesignTokens.typographyLineHeightHelpAnswer,
                color = DesignTokens.colorMuted,
            )
        }
    }
}

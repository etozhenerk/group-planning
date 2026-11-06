package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingPage(slide: OnboardingSlide, modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(
                horizontal = DesignTokens.componentMobileOnboardingInsetInline,
                vertical = DesignTokens.spaceS16,
            ),
        verticalArrangement = Arrangement.spacedBy(
            DesignTokens.componentMobileOnboardingArtworkGap,
        ),
    ) {
        if (slide == OnboardingSlide.Task || slide == OnboardingSlide.Meetings) {
            val density = LocalDensity.current
            val description = stringResource(slide.example)
            Box(
                Modifier.fillMaxWidth().heightIn(
                    min = DesignTokens.componentMobileOnboardingTallArtworkHeight,
                ).then(
                    if (slide == OnboardingSlide.Task) {
                        Modifier.clearAndSetSemantics {
                            contentDescription = description
                        }
                    } else {
                        Modifier
                    },
                ),
            ) {
                CompositionLocalProvider(
                    LocalDensity provides Density(density.density, fontScale = 1f),
                ) {
                    if (slide == OnboardingSlide.Task) TaskExample() else PlansExample()
                }
                if (slide == OnboardingSlide.Task) {
                    Box(Modifier.matchParentSize().pointerInput(Unit) { detectTapGestures {} })
                }
            }
        } else {
            OnboardingArtwork(
                slide,
                Modifier.fillMaxWidth().height(
                    if (slide ==
                        OnboardingSlide.Conversation
                    ) {
                        DesignTokens.componentMobileOnboardingTallArtworkHeight
                    } else {
                        DesignTokens.componentMobileOnboardingArtworkHeight
                    },
                ),
            )
        }
        Column(
            Modifier.fillMaxWidth().testTag("slide-${slide.ordinal}"),
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.componentMobileOnboardingCopyGap,
            ),
        ) {
            Text(
                stringResource(slide.title),
                fontSize = DesignTokens.typographySizeMobileOnboardingTitle,
                lineHeight =
                DesignTokens.typographySizeMobileOnboardingTitle *
                    DesignTokens.typographyLineHeightMobileOnboardingTitle.toFloat(),
                fontWeight = FontWeight(DesignTokens.typographyWeightMobileOnboardingTitle.toInt()),
                letterSpacing = (-DesignTokens.componentMobileOnboardingTitleTracking.value).sp,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                stringResource(slide.text),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeBody,
                lineHeight =
                DesignTokens.typographySizeBody *
                    DesignTokens.typographyLineHeightMobileOnboardingBody.toFloat(),
            )
        }
    }
}

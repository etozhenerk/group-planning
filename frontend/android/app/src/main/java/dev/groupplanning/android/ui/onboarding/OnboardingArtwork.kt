package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Density
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingArtwork(slide: OnboardingSlide, modifier: Modifier = Modifier) {
    val density = LocalDensity.current
    val description = stringResource(slide.example)
    val semantics = if (slide ==
        OnboardingSlide.Meetings
    ) {
        Modifier
    } else {
        Modifier.clearAndSetSemantics {
            contentDescription =
                description
        }
    }
    BoxWithConstraints(modifier.then(semantics)) {
        val width = DesignTokens.componentMobileOnboardingArtworkReferenceWidth
        val height = if (slide == OnboardingSlide.Conversation ||
            slide == OnboardingSlide.Task
        ) {
            DesignTokens.componentMobileOnboardingTallArtworkHeight
        } else {
            DesignTokens.componentMobileOnboardingArtworkHeight
        }
        val scale = minOf(1f, maxWidth / width)
        CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 1f)) {
            Box(
                Modifier.requiredSize(width, height).align(Alignment.Center).graphicsLayer {
                    scaleX =
                        scale
                    scaleY = scale
                },
                contentAlignment = Alignment.Center,
            ) {
                when (slide) {
                    OnboardingSlide.Invitation -> InvitationExample()
                    OnboardingSlide.Meetings -> PlansExample()
                    OnboardingSlide.Conversation -> ConversationExample()
                    OnboardingSlide.Date -> DateExample()
                    OnboardingSlide.Poll -> PollExample()
                    OnboardingSlide.Task -> TaskExample()
                    OnboardingSlide.Album -> OnboardingAlbumExample()
                    OnboardingSlide.Plans -> OnboardingMeetingPreview(first = true)
                }
                if (slide !=
                    OnboardingSlide.Meetings
                ) {
                    Box(Modifier.matchParentSize().pointerInput(Unit) { detectTapGestures {} })
                }
            }
        }
    }
}

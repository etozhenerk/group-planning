package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun OnboardingArtwork(slide: OnboardingSlide, modifier: Modifier = Modifier) {
    val density = LocalDensity.current
    val glow = Palette.accent.copy(alpha = 0.1f)
    BoxWithConstraints(modifier.clearAndSetSemantics { contentDescription = slide.example }) {
        val scale = minOf(1f, maxWidth.value / 330, maxHeight.value / 330)
        CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 1f)) {
            Box(
                Modifier.requiredSize(330.dp).align(Alignment.Center)
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                    },
                contentAlignment = Alignment.Center,
            ) {
                Canvas(Modifier.fillMaxSize()) {
                    drawCircle(
                        Brush.radialGradient(listOf(glow, Color.Transparent)),
                        radius = size.minDimension / 2,
                    )
                }
                Box(Modifier.padding(8.dp)) {
                    when (slide) {
                        OnboardingSlide.Invitation -> InvitationExample()
                        OnboardingSlide.Conversation -> ConversationExample()
                        OnboardingSlide.Poll -> PollExample()
                        OnboardingSlide.Task -> TaskExample()
                        OnboardingSlide.Plans -> PlansExample()
                    }
                }
            }
        }
    }
}

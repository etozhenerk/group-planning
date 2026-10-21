package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun OnboardingPage(slide: OnboardingSlide, modifier: Modifier = Modifier) {
    BoxWithConstraints(modifier.fillMaxSize()) {
        val artworkHeight = (maxHeight * 0.51f).coerceIn(210.dp, 310.dp)
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(26.dp, 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically),
        ) {
            OnboardingArtwork(slide, Modifier.fillMaxWidth().height(artworkHeight))
            Column(
                Modifier.fillMaxWidth().widthIn(max = 400.dp).testTag("slide-${slide.ordinal}"),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                if (slide == OnboardingSlide.Poll || slide == OnboardingSlide.Task) {
                    Text("Скоро", color = Palette.accent, fontSize = 13.sp)
                }
                Text(
                    slide.title,
                    fontSize = 32.sp,
                    lineHeight = 37.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.9).sp,
                    modifier = Modifier.semantics { heading() },
                )
                Text(slide.text, color = Palette.muted, fontSize = 17.sp, lineHeight = 25.sp)
                if (slide == OnboardingSlide.Plans) {
                    Text("Вход через Яндекс ID", fontSize = 14.sp, color = Palette.muted)
                }
            }
        }
    }
}

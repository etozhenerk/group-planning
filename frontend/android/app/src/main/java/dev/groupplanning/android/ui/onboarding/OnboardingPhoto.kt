package dev.groupplanning.android.ui.onboarding

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource

@Composable
internal fun OnboardingPhoto(@DrawableRes image: Int, modifier: Modifier = Modifier) {
    Image(painterResource(image), null, modifier.fillMaxSize(), contentScale = ContentScale.Crop)
}

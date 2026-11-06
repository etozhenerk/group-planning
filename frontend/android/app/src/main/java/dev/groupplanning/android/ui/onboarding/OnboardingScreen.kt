package dev.groupplanning.android.ui.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.brand.BrandWordmark
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlin.math.abs
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

@Composable
internal fun OnboardingScreen(
    authenticating: Boolean = false,
    problem: Boolean = false,
    signIn: () -> Unit = {},
    startWithSignIn: Boolean = false,
) {
    val pager = rememberPagerState(
        initialPage = if (startWithSignIn) OnboardingSlide.entries.lastIndex else 0,
    ) { OnboardingSlide.entries.size }
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    var navigation by remember { mutableStateOf<Job?>(null) }
    val moving = authenticating
    val selected = pager.settledPage
    val last = OnboardingSlide.entries.lastIndex
    val go: (Int) -> Unit = { target ->
        if (!moving) {
            navigation?.cancel()
            navigation = scope.launch {
                if (motion) {
                    pager.animateScrollToPage(
                        target,
                        animationSpec = tween(DesignTokens.motionDurationNavigation),
                    )
                } else {
                    pager.scrollToPage(target)
                }
            }
        }
    }
    BackHandler(selected > 0) { go((pager.targetPage - 1).coerceAtLeast(0)) }
    Column(Modifier.fillMaxSize().testTag("onboarding")) {
        if (LocalDensity.current.fontScale > 1.3f) {
            Column(
                Modifier.fillMaxWidth().padding(
                    horizontal = DesignTokens.spaceS24,
                    vertical = DesignTokens.spaceS8,
                ),
            ) {
                BrandWordmark(compact = true)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    OnboardingQuietButton(
                        stringResource(R.string.onboarding_skip),
                        selected < last,
                        !moving,
                    ) {
                        go(last)
                    }
                }
            }
        } else {
            Row(
                Modifier.fillMaxWidth().padding(
                    horizontal = DesignTokens.spaceS24,
                    vertical = DesignTokens.spaceS8,
                ),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BrandWordmark(compact = true)
                OnboardingQuietButton(
                    stringResource(R.string.onboarding_skip),
                    selected < last,
                    !moving,
                ) {
                    go(last)
                }
            }
        }
        HorizontalPager(
            pager,
            Modifier.weight(1f).testTag("onboarding-pager"),
            userScrollEnabled = !authenticating,
        ) { page ->
            OnboardingPage(
                OnboardingSlide.entries[page],
                Modifier.graphicsLayer {
                    val distance = abs((pager.currentPage - page) + pager.currentPageOffsetFraction)
                        .coerceIn(0f, 1f)
                    alpha = if (motion) 1f - distance * 0.18f else 1f
                },
            )
        }
        if (problem) {
            Column(
                Modifier.fillMaxWidth().padding(
                    horizontal = DesignTokens.componentMobileOnboardingInsetInline,
                ).padding(bottom = DesignTokens.spaceS8),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
            ) {
                Text(
                    stringResource(R.string.onboarding_auth_error),
                    color = DesignTokens.colorError,
                    fontSize = DesignTokens.typographySizeSmall,
                )
                Text(
                    stringResource(R.string.onboarding_auth_retry),
                    color = DesignTokens.colorError,
                    fontSize = DesignTokens.typographySizeCaption,
                )
            }
        }
        OnboardingControls(
            selected,
            !moving,
            go,
            busy = authenticating,
            moving = pager.isScrollInProgress,
        ) {
            if (selected < last) {
                go((pager.targetPage + 1).coerceAtMost(last))
            } else if (pager.targetPage == last && !pager.isScrollInProgress) {
                signIn()
            }
        }
    }
}

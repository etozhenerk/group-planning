package dev.groupplanning.android.ui.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.brand.BrandWordmark
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import kotlin.math.abs
import kotlinx.coroutines.launch

@Composable
internal fun OnboardingScreen() {
    val pager = rememberPagerState { OnboardingSlide.entries.size }
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    var requested by remember { mutableStateOf(false) }
    var login by rememberSaveable { mutableStateOf(false) }
    val moving = requested || pager.isScrollInProgress
    val selected = pager.settledPage
    val go: (Int) -> Unit = { target ->
        if (!moving) {
            requested = true
            scope.launch {
                try {
                    if (motion) pager.animateScrollToPage(target) else pager.scrollToPage(target)
                } finally {
                    requested = false
                }
            }
        }
    }
    BackHandler(selected > 0) { go(selected - 1) }
    Column(Modifier.fillMaxSize().testTag("onboarding")) {
        if (LocalDensity.current.fontScale > 1.3f) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp)) {
                BrandWordmark(compact = true)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    OnboardingQuietButton("Пропустить", selected < 4, !moving) { go(4) }
                }
            }
        } else {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BrandWordmark(compact = true)
                OnboardingQuietButton("Пропустить", selected < 4, !moving) { go(4) }
            }
        }
        HorizontalPager(pager, Modifier.weight(1f).testTag("onboarding-pager")) { page ->
            OnboardingPage(
                OnboardingSlide.entries[page],
                Modifier.graphicsLayer {
                    val distance = abs((pager.currentPage - page) + pager.currentPageOffsetFraction)
                        .coerceIn(0f, 1f)
                    scaleX = if (motion) 1f - distance * 0.045f else 1f
                    scaleY = scaleX
                    alpha = if (motion) 1f - distance * 0.18f else 1f
                },
            )
        }
        OnboardingControls(selected, !moving, go) {
            if (selected < 4) go(selected + 1) else login = true
        }
    }
    if (login) {
        AlertDialog(
            onDismissRequest = { login = false },
            title = { Text("Вход ещё не подключён") },
            text = { Text("Яндекс ID подключим на заключительном этапе разработки.") },
            confirmButton = { TextButton(onClick = { login = false }) { Text("Понятно") } },
        )
    }
}

package dev.groupplanning.android.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.brand.BrandMotion
import dev.groupplanning.android.ui.brand.BrandWordmark
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.invitation.InvitationScreen
import dev.groupplanning.android.ui.invitation.LinkProblemDialog
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.motion.rememberMotionEnabled
import dev.groupplanning.android.ui.onboarding.OnboardingScreen
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SomewhereApp(model: AppViewModel) {
    val auth by model.signIn.state.collectAsStateWithLifecycle()
    val snapshot by model.snapshot.collectAsStateWithLifecycle()
    val route by model.route.collectAsStateWithLifecycle()
    val elapsed by model.elapsed.collectAsStateWithLifecycle()
    val ready by model.ready.collectAsStateWithLifecycle()
    val linkProblem by model.linkProblem.collectAsStateWithLifecycle()
    val motion = rememberMotionEnabled()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            var previous: Long? = null
            while (model.elapsed.value < BrandMotion.DURATION_NANOS) {
                withFrameNanos { frame ->
                    previous?.let { model.advanceIntro(frame - it) }
                    previous = frame
                }
            }
        }
    }
    CompositionLocalProvider(LocalMotionEnabled provides motion) {
        if (auth.problem) {
            AlertDialog(
                onDismissRequest = model.signIn::dismissProblem,
                title = { Text(stringResource(R.string.auth_failed)) },
                text = { Text(stringResource(R.string.auth_retry_hint)) },
                confirmButton = {
                    TextButton(onClick = model.signIn::dismissProblem) {
                        Text(stringResource(R.string.understood))
                    }
                },
            )
        }
        linkProblem?.let { LinkProblemDialog(it, model::dismissLinkProblem) }
        Surface(Modifier.fillMaxSize(), color = Palette.background) {
            Crossfade(
                ready && elapsed >= BrandMotion.DURATION_NANOS,
                animationSpec = tween(if (motion) 200 else 0),
                label = "launch",
            ) { shown ->
                Box(Modifier.fillMaxSize().safeDrawingPadding()) {
                    if (!shown) {
                        Box(
                            Modifier.fillMaxSize().padding(24.dp).testTag("launch"),
                            contentAlignment = Alignment.Center,
                        ) {
                            BrandWordmark(rotation = { BrandMotion.rotation(elapsed, motion) })
                        }
                    } else {
                        if (snapshot.session is SessionState.Failed) {
                            Box(
                                Modifier.padding(24.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                StatusPanel(
                                    "Не удалось восстановить вход",
                                    "Проверьте соединение и повторите запрос.",
                                    model::restore,
                                )
                            }
                        } else if (route is AppRoute.Invitation) {
                            InvitationScreen(
                                (route as AppRoute.Invitation).model,
                                model::home,
                                authenticating = auth.busy,
                                signIn = model::startSignIn,
                            )
                        } else {
                            when (snapshot.session) {
                                is SessionState.Authenticated -> PrivateContent(
                                    model,
                                    route,
                                    snapshot,
                                )
                                else -> OnboardingScreen(
                                    authenticating = auth.busy,
                                    signIn = model::startSignIn,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

package dev.groupplanning.android

import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.EmptyCoroutineContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler

// One scheduler per rule; Compose derives its MainTestClock from this dispatcher.
// Drain current effects on main before Compose checks its pending frames.
@OptIn(ExperimentalCoroutinesApi::class, ExperimentalTestApi::class)
internal fun qaCreateComposeRule(
    effectContext: CoroutineContext = EmptyCoroutineContext,
): ComposeContentTestRule {
    val scheduler = TestCoroutineScheduler()
    return createComposeRule(effectContext + StandardTestDispatcher(scheduler)).also {
        it.registerIdlingResource(QaCoroutineIdlingResource(scheduler))
    }
}

@OptIn(ExperimentalCoroutinesApi::class, ExperimentalTestApi::class)
internal fun qaCreateEmptyComposeRule(
    effectContext: CoroutineContext = EmptyCoroutineContext,
): ComposeTestRule {
    val scheduler = TestCoroutineScheduler()
    return createEmptyComposeRule(effectContext + StandardTestDispatcher(scheduler)).also {
        it.registerIdlingResource(QaCoroutineIdlingResource(scheduler))
    }
}

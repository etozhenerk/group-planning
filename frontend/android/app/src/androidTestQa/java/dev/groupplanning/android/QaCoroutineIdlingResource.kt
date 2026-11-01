package dev.groupplanning.android

import android.os.Looper
import androidx.compose.ui.test.IdlingResource
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestCoroutineScheduler

// Registered before Compose's own resource in pinned UI Test 1.9.5.
// Its idle check does not otherwise see queued initial effects or network resumptions.
// Run only work at the current virtual time; Compose retains control of animation frames.
@OptIn(ExperimentalCoroutinesApi::class)
internal class QaCoroutineIdlingResource(private val scheduler: TestCoroutineScheduler) :
    IdlingResource {
    override val isIdleNow: Boolean
        get() {
            check(Looper.myLooper() == Looper.getMainLooper())
            scheduler.runCurrent()
            return true
        }
}

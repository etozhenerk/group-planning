package dev.groupplanning.android

import android.os.Looper
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.onNodeWithTag
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread
import kotlin.coroutines.resume
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.suspendCancellableCoroutine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class QaCompositionThreadUiTests {
    @get:Rule val compose = qaCreateComposeRule()

    @Test fun callbackCompletionKeepsEffectsAndSubsequentApplyOnMainThread() {
        val waiting = CountDownLatch(1)
        val completed = CountDownLatch(1)
        val callback = AtomicReference<(() -> Unit)?>(null)
        val effectThread = AtomicReference<Thread?>(null)
        val applyThread = AtomicReference<Thread?>(null)
        val laterState = mutableIntStateOf(0)
        compose.setContent {
            val result = remember { mutableIntStateOf(0) }
            LaunchedEffect(Unit) {
                suspendCancellableCoroutine<Unit> { continuation ->
                    callback.set { continuation.resume(Unit) }
                    waiting.countDown()
                }
                effectThread.set(Thread.currentThread())
                result.intValue = 1
            }
            BasicText(
                "${result.intValue}:${laterState.intValue}",
                Modifier.testTag("callback-result"),
            )
            SideEffect { applyThread.set(Thread.currentThread()) }
        }
        assertTrue("effect did not subscribe", waiting.await(5, TimeUnit.SECONDS))
        val worker = thread(name = "qa-network-callback", isDaemon = true) {
            try {
                checkNotNull(callback.get()).invoke()
            } finally {
                completed.countDown()
            }
        }
        try {
            assertTrue("callback did not return", completed.await(5, TimeUnit.SECONDS))
            compose.waitForIdle()
            compose.onNodeWithTag("callback-result").assertTextEquals("1:0")
            val mainThread = Looper.getMainLooper().thread
            assertEquals("effect resumed on callback thread", mainThread, effectThread.get())
            assertEquals("apply ran off main", mainThread, applyThread.get())
            compose.runOnUiThread { laterState.intValue = 1 }
            compose.waitForIdle()
            compose.onNodeWithTag("callback-result").assertTextEquals("1:1")
            assertEquals("subsequent apply ran off main", mainThread, applyThread.get())
        } finally {
            worker.join(5_000)
            assertTrue("callback worker leaked", !worker.isAlive)
        }
    }

    @Test fun backgroundStateFlowKeepsLifecycleCollectionAndLaterApplyOnMainThread() {
        val source = MutableStateFlow(0)
        val effectThread = AtomicReference<Thread?>(null)
        val applyThread = AtomicReference<Thread?>(null)
        val laterState = mutableIntStateOf(0)
        val observed = source.onEach { effectThread.set(Thread.currentThread()) }
        compose.setContent {
            val result by observed.collectAsStateWithLifecycle(initialValue = 0)
            BasicText("$result:${laterState.intValue}", Modifier.testTag("flow-result"))
            SideEffect { applyThread.set(Thread.currentThread()) }
        }
        compose.waitForIdle()
        compose.onNodeWithTag("flow-result").assertTextEquals("0:0")
        val worker = thread(name = "qa-network-state-flow", isDaemon = true) {
            source.value = 1
        }
        try {
            worker.join(5_000)
            assertTrue("state producer worker leaked", !worker.isAlive)
            compose.waitForIdle()
            compose.onNodeWithTag("flow-result").assertTextEquals("1:0")
            val mainThread = Looper.getMainLooper().thread
            assertEquals("lifecycle collector resumed off main", mainThread, effectThread.get())
            assertEquals("StateFlow apply ran off main", mainThread, applyThread.get())
            compose.runOnUiThread { laterState.intValue = 1 }
            compose.waitForIdle()
            compose.onNodeWithTag("flow-result").assertTextEquals("1:1")
            assertEquals("later apply ran off main", mainThread, applyThread.get())
        } finally {
            worker.join(5_000)
            assertTrue("state producer worker leaked", !worker.isAlive)
        }
    }
}

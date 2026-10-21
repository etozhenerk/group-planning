package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.data.repository.ResourcePhase
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class RepositoryTests {
    @Test fun emptyErrorAndRetryAreDistinct() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue("meetings", status = 503)
        h.meetings.loadMeetings()
        assertEquals(ResourcePhase.Failed, h.session.state.value.data.meetings.phase)
        assertNull(h.session.state.value.data.meetings.value)
        h.transport.enqueue("meetings", apiJson.encodeToString(MeetingsPage(emptyList(), null)))
        h.meetings.loadMeetings()
        assertEquals(ResourcePhase.Ready, h.session.state.value.data.meetings.phase)
        assertTrue(checkNotNull(h.session.state.value.data.meetings.value).meetings.isEmpty())
    }

    @Test fun newerRequestWinsWhenEarlierResponseArrivesLast() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val start = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            start.complete(Unit)
            gate.await()
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(MeetingsPage(listOf(Fixtures.summary()), null)),
            )
        }
        val old = launch { h.meetings.loadMeetings() }
        start.await()
        h.transport.enqueue("meetings", apiJson.encodeToString(MeetingsPage(emptyList(), null)))
        h.meetings.loadMeetings()
        gate.complete(Unit)
        old.join()
        assertTrue(checkNotNull(h.session.state.value.data.meetings.value).meetings.isEmpty())
    }

    @Test fun cancellationLeavesNoPermanentLoadingState() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val start = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            start.complete(Unit)
            CompletableDeferred<WireResponse>().await()
        }
        val task = launch { h.meetings.loadMeetings() }
        start.await()
        task.cancelAndJoin()
        assertEquals(ResourcePhase.Idle, h.session.state.value.data.meetings.phase)
    }

    @Test fun viewModelSurvivesOwnerRecreationAndCancelsWhenStoreClears() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = SessionHarness(dispatcher)
        h.login()
        var cancelled = false
        h.transport.handle("meetings") {
            try {
                CompletableDeferred<WireResponse>().await()
            } finally {
                cancelled = true
            }
        }
        val store = ViewModelStore()
        val factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                MeetingListViewModel(h.meetings, CoroutineScope(SupervisorJob() + dispatcher)) as T
        }
        val first = ViewModelProvider.create(store, factory)[MeetingListViewModel::class]
        first.refresh()
        runCurrent()
        val recreated = ViewModelProvider.create(store, factory)[MeetingListViewModel::class]
        assertSame(first, recreated)
        assertEquals(ResourcePhase.Loading, recreated.state.value.data.meetings.phase)
        assertFalse(cancelled)
        store.clear()
        runCurrent()
        assertTrue(cancelled)
        assertEquals(ResourcePhase.Idle, h.session.state.value.data.meetings.phase)
    }
}

@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.album

import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.state.album.AlbumDownloadController
import dev.groupplanning.android.state.album.AlbumDownloadState
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AlbumDownloadControllerTests {
    @Test fun oneAttemptChangesToSavingAndIgnoresCancelAfterHandoff() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        val prepare = CompletableDeferred<Unit>()
        val publish = CompletableDeferred<Unit>()
        var calls = 0
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) {
                    _,
                    publishing,
                ->
                calls += 1
                prepare.await()
                publishing()
                publish.await()
                3
            }
        controller.enter()
        controller.start()
        controller.start()
        runCurrent()
        assertEquals(1, calls)
        assertEquals(AlbumDownloadState.Preparing, controller.state.value)
        prepare.complete(Unit)
        runCurrent()
        assertEquals(AlbumDownloadState.Saving, controller.state.value)
        controller.cancel()
        assertEquals(AlbumDownloadState.Saving, controller.state.value)
        publish.complete(Unit)
        runCurrent()
        assertEquals(AlbumDownloadState.Saved, controller.state.value)
    }

    @Test fun leaveAndCancellationRejectLatePublicationAndAllowNewAttempt() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        val release = CompletableDeferred<Unit>()
        var calls = 0
        var published = 0
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) {
                    _,
                    publishing,
                ->
                calls += 1
                if (calls == 1) withContext(NonCancellable) { release.await() }
                publishing()
                published += 1
                3
            }
        controller.enter()
        controller.start()
        runCurrent()
        controller.cancel()
        controller.leave()
        controller.enter()
        controller.start()
        runCurrent()
        assertEquals(1, calls)
        release.complete(Unit)
        runCurrent()
        assertEquals(2, calls)
        assertEquals(1, published)
        assertEquals(AlbumDownloadState.Saved, controller.state.value)
    }

    @Test fun revokedAccessClearsPreparationAndLateResultCannotReturnIt() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) { _, _ ->
                awaitCancellation()
            }
        controller.enter()
        controller.start()
        runCurrent()
        sessions.session.updateAccess(Fixtures.meetingId, allowed = false)
        runCurrent()
        assertEquals(AlbumDownloadState.Revoked, controller.state.value)
        controller.start()
        assertEquals(AlbumDownloadState.Revoked, controller.state.value)
    }

    @Test fun preparationCanRetryButPartialPublicationRequiresAcknowledgement() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        var calls = 0
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) {
                    _,
                    publishing,
                ->
                calls += 1
                if (calls == 1) throw ClientFailure(FailureKind.Network)
                publishing()
                throw AlbumSaveFailure(AlbumSaveIssue.Storage)
            }
        controller.enter()
        controller.start()
        runCurrent()
        assertEquals(AlbumDownloadState.Failed, controller.state.value)
        controller.start()
        runCurrent()
        assertEquals(AlbumDownloadState.Partial, controller.state.value)
        controller.start()
        runCurrent()
        assertEquals(2, calls)
        controller.acknowledgePartial()
        assertEquals(AlbumDownloadState.Idle, controller.state.value)
    }

    @Test fun confirmedPublicationWithCleanupFailureIsStillSaved() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) {
                    _,
                    publishing,
                ->
                publishing()
                throw AlbumSaveFailure(AlbumSaveIssue.SavedCleanupPending, 3)
            }
        controller.enter()
        controller.start()
        runCurrent()
        assertEquals(AlbumDownloadState.Saved, controller.state.value)
    }

    @Test fun permissionDenialIsRecoverableAndDetachedCallbackIsIgnored() = runTest {
        val sessions = SessionHarness(StandardTestDispatcher(testScheduler))
        sessions.login()
        var invoked = false
        val controller =
            AlbumDownloadController(Fixtures.meetingId, sessions.session, backgroundScope) { _, _ ->
                invoked = true
                throw AlbumSaveFailure(AlbumSaveIssue.PermissionRequired)
            }
        controller.enter()
        controller.start()
        runCurrent()
        assertTrue(invoked)
        assertEquals(AlbumDownloadState.PermissionRequired, controller.state.value)
        controller.permissionGranted()
        assertEquals(AlbumDownloadState.Idle, controller.state.value)
        controller.leave()
        controller.permissionDenied()
        assertEquals(AlbumDownloadState.Idle, controller.state.value)
    }
}

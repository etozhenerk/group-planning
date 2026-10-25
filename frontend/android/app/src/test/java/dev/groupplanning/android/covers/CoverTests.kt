@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.covers

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.api.requests.CoverRequests
import dev.groupplanning.android.data.covers.CoverIssue
import dev.groupplanning.android.data.drafts.CoverDraft
import dev.groupplanning.android.data.drafts.DraftRecord
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.covers.CoverSelectionViewModel
import dev.groupplanning.android.state.settings.settingsDraft
import dev.groupplanning.android.state.settings.settingsPatch
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.async
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class CoverTests {
    private val origin = ApiOrigin("https://example.test")
    private val id = Fixtures.meetingId
    private val url = "https://example.test/api/v1/meetings/$id/cover?v=" + "a".repeat(64)
    private val image = PreparedCover("image/jpeg", "Y292ZXI=")

    @Test fun photoSurvivesDraftSerializationAndPatchHasThreeDistinctMeanings() {
        val draft =
            MeetingDraft(
                "Europe/Moscow",
                title = "Фото",
                day = "2026-10-25",
                cover = CoverDraft(image),
            )
        val record = DraftRecord(Fixtures.userId, draft, submission = draft.validate().input)
        assertEquals(record, apiJson.decodeFromString<DraftRecord>(apiJson.encodeToString(record)))
        assertEquals(image, draft.validate().input?.cover)
        val original = Fixtures.meeting()
        val old = original.settingsDraft()
        assertFalse(checkNotNull(settingsPatch(original, old).input).json().containsKey("cover"))
        assertEquals(
            "null",
            checkNotNull(
                settingsPatch(original, old.copy(cover = CoverDraft())).input,
            ).json()["cover"].toString(),
        )
        assertTrue(
            checkNotNull(
                settingsPatch(original, old.copy(cover = CoverDraft(image))).input,
            ).json()["cover"].toString().contains("image/jpeg"),
        )
    }

    @Test fun imagesCannotSendCredentialsToOtherOriginOrEndpoint() {
        assertEquals(id, CoverRequests.read(url, id, origin).meetingId)
        val public = url.replace("meetings/$id", "invitations/" + "A".repeat(22))
        assertNull(CoverRequests.read(public, id, origin).meetingId)
        for (invalid in listOf(
            url.replace("example.test", "elsewhere.test"),
            url.replace("https", "http"),
            url + "&v=b",
            url + "#x",
            url.replace("/cover?", "/messages?"),
            url.replace(id.toString(), UUID.randomUUID().toString()),
            url.replace("https://", "https://user:password@"),
        )) {
            assertThrows(ClientFailure::class.java) { CoverRequests.read(invalid, id, origin) }
        }
    }

    @Test fun binaryTransportUsesSessionAndRejectsWrongMime() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val path = "meetings/$id/cover"
        h.transport.handle(path) { WireResponse(200, "image/png", bytes = byteArrayOf(0, 1, -1)) }
        val access = h.session.meetingAccess(id)
        assertArrayEquals(
            byteArrayOf(0, 1, -1),
            h.session.image(CoverRequests.read(url, id, origin), access.request),
        )
        assertEquals("Bearer test-secret", h.transport.requests.last().header("Authorization"))
        assertEquals("image/jpeg, image/png", h.transport.requests.last().header("Accept"))
        h.transport.enqueue(path, "<svg/>", mime = "image/svg+xml")
        val failure = runCatching {
            h.session.image(CoverRequests.read(url, id, origin), access.request)
        }.exceptionOrNull()
        assertTrue(failure is ClientFailure)
    }

    @Test fun latePhotoCannotRestoreRevokedAccessAndImage401ClearsSession() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val path = "meetings/$id/cover"
        val pending = CompletableDeferred<WireResponse>()
        h.transport.handle(path) { withContext(NonCancellable) { pending.await() } }
        val access = h.session.meetingAccess(id)
        val request = CoverRequests.read(url, id, origin)
        val image = async { runCatching { h.session.image(request, access.request) } }
        runCurrent()
        h.session.updateAccess(id, allowed = false)
        pending.complete(WireResponse(200, "image/png", bytes = byteArrayOf(1)))
        runCurrent()
        assertTrue(image.isCancelled || image.await().isFailure)
        h.session.updateAccess(id, allowed = true)
        h.transport.enqueue(path, status = 401)
        runCatching { h.session.image(request, h.session.meetingAccess(id).request) }
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
    }

    @Test fun publicPhotoDoesNotAcquireBearer() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val path = "invitations/" + "A".repeat(22) + "/cover"
        h.transport.handle(path) { WireResponse(200, "image/png", bytes = byteArrayOf(1)) }
        val request = CoverRequests.read(
            "https://example.test/api/v1/$path?v=" + "a".repeat(64),
            id,
            origin,
        )
        ApiClient(origin, h.transport).image(request)
        assertNull(h.transport.requests.last().header("Authorization"))
    }

    @Test fun refusalAndCancellationKeepPreviousPhotoAndBusyEndsBeforeCommit() = runTest {
        val model = CoverSelectionViewModel(backgroundScope)
        var busy = false
        var draft = CoverDraft(image)
        val onBusy: (Boolean) -> Unit = { busy = it }
        val change: (CoverDraft) -> Unit = {
            assertFalse(busy)
            draft = it
        }
        model.select({ throw CoverIssue() }, onBusy, change)
        runCurrent()
        assertEquals(image, draft.image)
        assertFalse(busy)
        assertTrue(model.state.value.issue != null)
        model.select({ null }, onBusy, change)
        runCurrent()
        assertEquals(image, draft.image)
        assertNull(model.state.value.issue)
        model.select({ image.copy(data = "bmV3") }, onBusy, change)
        runCurrent()
        assertEquals("bmV3", draft.image?.data)
    }
}

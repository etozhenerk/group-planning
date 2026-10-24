@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.state.settings.SettingsIssue
import dev.groupplanning.android.state.settings.SettingsViewModel
import dev.groupplanning.android.state.settings.settingsDraft
import dev.groupplanning.android.state.settings.settingsPatch
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class SettingsTests {
    @Test fun changingTextPreservesOriginalAmbiguousInstantAndExplicitNullClearsFields() {
        val original = Fixtures.meeting().copy(
            startsAt = ApiInstant("2026-11-01T01:30:00-05:00"),
            timezone = "America/New_York",
            description = "Было",
            place = "Парк",
        )
        val draft = original.settingsDraft().copy(description = "", place = "")
        val patch = checkNotNull(settingsPatch(original, draft).input)
        assertFalse(patch.json().containsKey("starts_at"))
        assertNull(patch.timezone)
        assertEquals("null", patch.json()["description"].toString())
        assertEquals("null", patch.json()["place"].toString())
    }

    @Test fun clearingTimePreservesDayAndDateOnlyDraftDoesNotAcquireMidnight() {
        val original = Fixtures.meeting().copy(
            startsAt = ApiInstant("2026-11-01T01:30:00-05:00"),
            timezone = "America/New_York",
        )
        val draft = original.settingsDraft().copy(time = null)
        val patch = checkNotNull(settingsPatch(original, draft).input).json()
        assertEquals("null", patch["starts_at"].toString())
        assertEquals("\"2026-11-01\"", patch["starts_on"].toString())
        val dateOnly = original.copy(startsAt = null, startsOn = "2026-11-01")
        val restored = dateOnly.settingsDraft()
        assertEquals(draft.day, restored.day)
        assertNull(restored.time)
        val unchanged = checkNotNull(settingsPatch(dateOnly, restored).input).json()
        assertFalse(unchanged.containsKey("starts_at"))
        assertFalse(unchanged.containsKey("starts_on"))
        val timed = checkNotNull(settingsPatch(dateOnly, restored.copy(time = "19:00")).input)
        assertEquals("\"2026-11-01T19:00:00-05:00\"", timed.json()["starts_at"].toString())
    }

    @Test fun conflictPreservesFormUntilExplicitReloadAndMutation403KeepsConversation() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            SettingsViewModel(
                Fixtures.meeting(),
                h.repository,
                h.repository.open(h.id),
                backgroundScope,
            )
        model.change { it.copy(title = "Моя правка") }
        h.transport.enqueue(h.path, "", 409)
        model.save()
        runCurrent()
        assertEquals(SettingsIssue.Conflict, model.state.value.issue)
        assertEquals("Моя правка", model.state.value.draft.title)
        model.save()
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PATCH" })
        h.transport.enqueue(h.path, "", 503)
        model.reload()
        runCurrent()
        assertEquals(SettingsIssue.Conflict, model.state.value.issue)
        assertFalse(model.state.value.editable)
        model.save()
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PATCH" })
        h.transport.enqueue(
            h.path,
            apiJson.encodeToString(
                Fixtures.meeting().copy(title = "Другой заголовок", revision = ServerCounter("2")),
            ),
        )
        model.reload()
        runCurrent()
        assertEquals("Другой заголовок", model.state.value.draft.title)
        model.change { it.copy(title = "После обновления") }
        h.transport.enqueue(h.path, "", 403)
        model.save()
        runCurrent()
        assertEquals(SettingsIssue.Forbidden, model.state.value.issue)
        assertFalse(h.id in h.session.state.value.data.denied)
    }

    @Test fun unknownSaveRetriesSameKeyAndOnlyChangedFields() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            SettingsViewModel(
                Fixtures.meeting(),
                h.repository,
                h.repository.open(h.id),
                backgroundScope,
            )
        model.change { it.copy(description = "Добавим описание") }
        h.transport.enqueue(h.path, "", 503)
        model.save()
        runCurrent()
        val pending = model.state.value.pending
        model.change { it.copy(title = "Нельзя пока менять") }
        assertEquals(Fixtures.meeting().title, model.state.value.draft.title)
        h.transport.enqueue(
            h.path,
            apiJson.encodeToString(Fixtures.meeting().copy(description = "Добавим описание")),
        )
        model.save()
        runCurrent()
        assertEquals(true, model.state.value.saved)
        assertEquals(
            listOf(pending?.key.toString(), pending?.key.toString()),
            h.transport.requests.filter {
                it.method == "PATCH"
            }.map { it.header("Idempotency-Key") },
        )
    }
}

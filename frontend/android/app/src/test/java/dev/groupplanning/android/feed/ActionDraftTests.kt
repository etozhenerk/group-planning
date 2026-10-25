@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Test

class ActionDraftTests {
    @Test fun backReopensAllActionDraftsAndRevocationClearsHiddenForms() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.page()
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { model.runActive() }
        runCurrent()
        model.createPoll(Fixtures.meeting())
        val date = checkNotNull(model.pollCreation.value)
        date.change { it.copy(dates = listOf("2026-11-01", "2026-11-02")) }
        model.closePollCreation()
        assertNull(model.pollCreation.value)
        model.createPoll(Fixtures.meeting())
        assertSame(date, model.pollCreation.value)
        assertEquals(listOf("2026-11-01", "2026-11-02"), date.state.value.draft?.dates)
        model.closePollCreation()

        model.createPlacePoll(Fixtures.meeting())
        val place = checkNotNull(model.placeCreation.value)
        place.change { it.copy(place = "Кафе", explanation = "Тихий зал") }
        model.closePlaceCreation()
        model.createPlacePoll(Fixtures.meeting())
        assertSame(place, model.placeCreation.value)
        assertEquals("Тихий зал", place.state.value.draft?.explanation)
        model.closePlaceCreation()

        model.createPreparationTask()
        val task = checkNotNull(model.taskCreation.value)
        task.title("Заказать пиццу")
        model.closeTaskCreation()
        model.createPreparationTask()
        assertSame(task, model.taskCreation.value)
        assertEquals("Заказать пиццу", task.state.value.title)
        model.closeTaskCreation()

        h.session.updateAccess(h.id, false)
        runCurrent()
        assertNull(date.state.value.draft)
        assertNull(place.state.value.draft)
        assertEquals("", task.state.value.title)
        model.createPreparationTask()
        assertNull(model.taskCreation.value)
    }
}

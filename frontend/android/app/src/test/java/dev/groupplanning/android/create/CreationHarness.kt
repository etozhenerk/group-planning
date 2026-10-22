package dev.groupplanning.android.create

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.drafts.DraftRecord
import dev.groupplanning.android.data.drafts.DraftRepository
import dev.groupplanning.android.data.drafts.DraftStorage
import dev.groupplanning.android.state.CreationViewModel
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope

internal class MemoryDrafts : DraftStorage {
    var record: DraftRecord? = null
    var fail = false
    override fun load(owner: UUID): DraftRecord? = record?.takeIf { it.owner == owner }
    override fun save(record: DraftRecord) {
        if (fail) throw ClientFailure(FailureKind.Storage)
        this.record = record
    }
    override fun remove(owner: UUID) {
        record = null
    }
}

internal class CreationHarness(private val test: TestScope) {
    val dispatcher = StandardTestDispatcher(test.testScheduler)
    val api = SessionHarness(dispatcher)
    val storage = MemoryDrafts()
    val drafts = DraftRepository(storage, dispatcher)
    fun model(day: java.time.LocalDate? = null): CreationViewModel = CreationViewModel(
        Fixtures.userId,
        api.session,
        drafts,
        "Europe/Moscow",
        CoroutineScope(
            test.backgroundScope.coroutineContext +
                SupervisorJob(test.backgroundScope.coroutineContext[Job]),
        ),
        initialDay = day,
    )
}

package dev.groupplanning.android.create

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.DraftRecord
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.ui.brand.BrandMotion
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DraftTests {
    private val valid =
        MeetingDraft("Europe/Moscow", title = " Встреча ", day = "2026-10-24", time = "19:00")

    @Test fun requiredFieldsAndOptionalNullsMatchContract() {
        assertEquals(DraftIssue.Title, valid.copy(title = "  ").validate().issue)
        assertEquals(DraftIssue.Day, valid.copy(day = null).validate().issue)
        assertEquals(DraftIssue.Time, valid.copy(time = null).validate().issue)
        val input = checkNotNull(valid.validate().input)
        assertEquals("Встреча", input.title)
        assertNull(input.description)
        assertNull(input.place)
        assertEquals("2026-10-24T19:00:00+03:00", input.startsAt.value)
        assertEquals(DraftIssue.Title, valid.copy(title = "а".repeat(121)).validate().issue)
        assertNotNull(valid.copy(title = "🍕".repeat(120)).validate().input)
        assertEquals(
            DraftIssue.Description,
            valid.copy(description = "а".repeat(4001)).validate().issue,
        )
    }

    @Test fun gapAndOverlapCannotSilentlyMoveMeetingTime() {
        val ny = valid.copy(timezone = "America/New_York")
        assertEquals(
            DraftIssue.Nonexistent,
            ny.copy(day = "2026-03-08", time = "02:30").validate().issue,
        )
        val repeated = ny.copy(day = "2026-11-01", time = "01:30")
        assertEquals(DraftIssue.Ambiguous, repeated.validate().issue)
        assertEquals(
            "2026-11-01T01:30:00-04:00",
            repeated.copy(repetition = Repetition.Earlier).validate().input?.startsAt?.value,
        )
        assertEquals(
            "2026-11-01T01:30:00-05:00",
            repeated.copy(repetition = Repetition.Later).validate().input?.startsAt?.value,
        )
        assertEquals(DraftIssue.Timezone, valid.copy(timezone = "invalid").validate().issue)
    }

    @Test fun persistedDraftKeepsZoneRequestAndFrozenPayload() {
        val record = DraftRecord(Fixtures.userId, valid, submission = valid.validate().input)
        val restored = apiJson.decodeFromString<DraftRecord>(apiJson.encodeToString(record))
        assertEquals(record, restored)
        assertEquals("Europe/Moscow", restored.value.timezone)
    }

    @Test fun brandMakesExactlyOneSmoothTurn() {
        assertEquals(0f, BrandMotion.rotation(0, true), 0f)
        assertEquals(180f, BrandMotion.rotation(600_000_000L, true), 0.001f)
        assertEquals(360f, BrandMotion.rotation(1_200_000_000L, true), 0f)
        assertEquals(360f, BrandMotion.rotation(Long.MAX_VALUE, true), 0f)
        assertEquals(0f, BrandMotion.rotation(600_000_000L, false), 0f)
        val angles = (0..120).map { BrandMotion.rotation(it * 10_000_000L, true) }
        assertTrue(angles.zipWithNext().all { (a, b) -> b >= a })
    }
}

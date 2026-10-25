package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.RsvpAnswer
import java.time.Instant
import kotlinx.coroutines.test.StandardTestDispatcher
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class JoinCutoffTests {
    @Test fun exactBoundaryAndReturningParticipantAreClosed() {
        val preview = InvitationHarness(StandardTestDispatcher()).preview().copy(
            startsAt = ApiInstant("2030-10-25T18:00:00+03:00"),
            myRsvp = RsvpAnswer.NotGoing,
        )
        assertTrue(preview.canJoinAt(Instant.parse("2030-10-25T13:59:59Z")))
        assertFalse(preview.canJoinAt(Instant.parse("2030-10-25T14:00:00Z")))
        assertTrue(
            preview.copy(myRsvp = RsvpAnswer.Going, canJoin = false)
                .canJoinAt(Instant.parse("2030-10-25T14:00:01Z")),
        )
    }

    @Test fun dateOnlyHasNoCutoffAndServerCanStillDeny() {
        val preview = InvitationHarness(StandardTestDispatcher()).preview().copy(
            startsAt = null,
            startsOn = "2030-10-25",
            myRsvp = null,
        )
        assertTrue(preview.canJoinAt(Instant.parse("2030-10-25T14:00:00Z")))
        assertFalse(preview.copy(canJoin = false).canJoinAt(Instant.now()))
    }
}

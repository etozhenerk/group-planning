package dev.groupplanning.android.models

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiErrorEnvelope
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.CreateMeeting
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FieldChange
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.InvitationsPage
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpResult
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UpdateMeeting
import dev.groupplanning.android.support.Fixtures
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ContractTests {
    @Test fun allSharedFixturesDecode() {
        val fixtures = Fixtures.all()
        assertTrue(fixtures.isNotEmpty())
        for (fixture in fixtures) {
            val body = fixture.body.toString()
            when (fixture.schema) {
                "MeetingsPage" -> apiJson.decodeFromString<CalendarPage>(body)
                "InvitationPreview" -> apiJson.decodeFromString<InvitationPreview>(body)
                "RsvpResult" -> apiJson.decodeFromString<RsvpResult>(body)
                "Error" -> apiJson.decodeFromString<ApiErrorEnvelope>(body)
                "FeedEntry" -> apiJson.decodeFromString<FeedEntry>(body)
                "CreateMeeting" -> apiJson.decodeFromString<CreateMeeting>(body)
                "PlacePoll" -> apiJson.decodeFromString<PlacePoll>(body)
                "DatePoll" -> apiJson.decodeFromString<DatePoll>(body)
                "InvitationsPage" -> apiJson.decodeFromString<InvitationsPage>(body)
                else -> error("Decoder missing for " + fixture.schema)
            }
        }
    }

    @Test fun dateOnlyCreationAndHiddenPollPreserveContract() {
        val creation = apiJson.decodeFromString<CreateMeeting>(Fixtures.json("date-only-create"))
        assertNull(creation.startsAt)
        assertEquals("2026-10-24", creation.startsOn)
        assertEquals(
            creation,
            apiJson.decodeFromString<CreateMeeting>(apiJson.encodeToString(creation)),
        )
        val poll = apiJson.decodeFromString<DatePoll>(Fixtures.json("date-poll-hidden"))
        assertTrue(poll.settings.hideResults)
        assertTrue(poll.options.all { it.votes == null && it.voters == null })
        assertEquals(1, poll.myOptionIds.size)
        assertTrue(poll.leaderOptionIds.isEmpty())
        assertNull(poll.appliedOptionId)
    }

    @Test fun placePollKeepsCountsOwnVoteAndFinalState() {
        val open = apiJson.decodeFromString<PlacePoll>(Fixtures.json("place-poll-open"))
        assertNull(open.previousPlace)
        assertEquals("for", open.myVote)
        assertEquals(2, open.votesFor)
        assertEquals(1, open.votesAgainst)
        assertEquals("9007199254740993", open.revision.value)
        assertTrue(open.canVote)
        assertNull(open.closedAt)
        for (state in listOf("applied", "rejected", "cancelled")) {
            val poll = apiJson.decodeFromString<PlacePoll>(Fixtures.json("place-poll-$state"))
            assertEquals(state, poll.state)
            assertFalse(poll.canVote)
            assertTrue(poll.closedAt != null)
        }
    }

    @Test fun absentDateAndLegacyDescriptionStayNull() {
        val invite = apiJson.decodeFromString<InvitationPreview>(
            Fixtures.json("undated-invitation"),
        )
        assertNull(invite.startsAt)
        val objectValue = apiJson.parseToJsonElement(Fixtures.json("public-invitation")).jsonObject
        val legacy = JsonObject(objectValue - "description")
        assertNull(apiJson.decodeFromString<InvitationPreview>(legacy.toString()).description)
    }

    @Test fun unknownFeedAndLargeSequenceRemainSafeData() {
        val entry = apiJson.decodeFromString<FeedEntry>(Fixtures.json("unknown-feed-kind"))
        assertNull(entry.messageText)
        assertEquals("9007199254740993", entry.sequence.value)
        assertTrue(entry.sequence > ServerCounter("9007199254740992"))
        val known = apiJson.decodeFromString<FeedEntry>(Fixtures.json("late-message-retry"))
        assertEquals("Буду к семи", known.messageText)
        assertNull(known.copy(payloadVersion = 2).messageText)
    }

    @Test fun conflictMayHaveNoPreviousAnswer() {
        val error = apiJson.decodeFromString<ApiErrorEnvelope>(
            Fixtures.json("first-answer-revision-conflict"),
        )
        val snapshot = checkNotNull(error.error.currentResponse)
        assertNull(snapshot.rsvp)
        assertEquals(ServerCounter.Zero, snapshot.rsvpRevision)
        assertFalse(snapshot.canAccessFeed)
    }

    @Test fun offsetAndNanosecondsRoundTrip() {
        val instant = ApiInstant("2026-10-24T19:00:00.123456789+03:00")
        assertEquals(instant, apiJson.decodeFromString<ApiInstant>(apiJson.encodeToString(instant)))
        assertEquals(
            ApiInstant("2026-10-24T16:00:00Z").instant,
            ApiInstant("2026-10-24T19:00:00+03:00").instant,
        )
        assertThrows(IllegalArgumentException::class.java) { ApiInstant("2026-99-32T19:00:00Z") }
    }

    @Test fun malformedWirePrimitivesAreRejected() {
        for (bad in listOf("", "01", "-1", "1.5", "١")) {
            assertThrows(IllegalArgumentException::class.java) { ServerCounter(bad) }
        }
        assertThrows(Exception::class.java) { apiJson.decodeFromString<ServerCounter>("42") }
        assertThrows(Exception::class.java) { apiJson.decodeFromString<RsvpAnswer>("\"unknown\"") }
    }

    @Test fun patchDistinguishesUnchangedAndClear() {
        val unchanged = UpdateMeeting(ServerCounter.Zero).json()
        assertFalse(unchanged.containsKey("description"))
        val patch = UpdateMeeting(ServerCounter.Zero, description = FieldChange.Clear).json()
        assertEquals(JsonNull, patch["description"])
    }
}

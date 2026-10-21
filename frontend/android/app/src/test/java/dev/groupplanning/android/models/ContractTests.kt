package dev.groupplanning.android.models

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiErrorEnvelope
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CreateMeeting
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FieldChange
import dev.groupplanning.android.data.api.models.InvitationPreview
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
        assertEquals(13, fixtures.size)
        for (fixture in fixtures) {
            val body = fixture.body.toString()
            when (fixture.schema) {
                "InvitationPreview" -> apiJson.decodeFromString<InvitationPreview>(body)
                "RsvpResult" -> apiJson.decodeFromString<RsvpResult>(body)
                "Error" -> apiJson.decodeFromString<ApiErrorEnvelope>(body)
                "FeedEntry" -> apiJson.decodeFromString<FeedEntry>(body)
                "CreateMeeting" -> apiJson.decodeFromString<CreateMeeting>(body)
                else -> error("Decoder missing for " + fixture.schema)
            }
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

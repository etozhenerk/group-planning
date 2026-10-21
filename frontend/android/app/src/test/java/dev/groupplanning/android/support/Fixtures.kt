package dev.groupplanning.android.support

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
internal data class ContractFixture(val name: String, val schema: String, val body: JsonElement)

internal object Fixtures {
    val userId: UUID = UUID.fromString("9e5299e4-af6d-4935-9588-a1a419895f5e")
    val meetingId: UUID = UUID.fromString("5cf76452-b7fa-4a5b-b785-1582b58b1d75")
    val expiry = ApiInstant("2099-01-01T00:00:00Z")
    val user = UserProfile(userId, "Лена")

    fun all(): List<ContractFixture> {
        val stream = checkNotNull(javaClass.classLoader?.getResourceAsStream("cases.json"))
        return stream.bufferedReader().use { apiJson.decodeFromString(it.readText()) }
    }

    fun json(name: String): String = all().single { it.name == name }.body.toString()

    fun summary(id: UUID = meetingId): MeetingSummary = MeetingSummary(
        id, "Встреча", null, "Europe/Moscow", null, null, 2,
        ServerCounter.Zero, RsvpAnswer.Going, ServerCounter("1"),
    )

    fun meeting(id: UUID = meetingId): Meeting = Meeting(
        id, "Встреча", null, "Europe/Moscow", null, null, 2,
        ServerCounter.Zero, RsvpAnswer.Going, ServerCounter("1"), userId, null, expiry,
    )
}

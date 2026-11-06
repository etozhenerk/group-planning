package dev.groupplanning.android.ui.onboarding

import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.DatePollOption
import dev.groupplanning.android.data.api.models.DatePollSettings
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import java.util.UUID
import kotlinx.serialization.json.JsonObject

internal object OnboardingExamples {
    private fun id(value: Long) = UUID(0, value)
    private val one = ServerCounter("1")
    private val time = ApiInstant("2026-11-07T15:45:00Z")
    val author = UserProfile(id(1), "Лена")
    val friend = UserProfile(id(2), "Миша")
    val meeting =
        Meeting(
            id(
                3,
            ),
            "",
            ApiInstant(
                "2026-11-07T16:00:00Z",
            ),
            "Europe/Moscow", null, null, 6, one, RsvpAnswer.Going, one, author.id, createdAt = time,
        )
    val entry =
        FeedEntry(id(4), meeting.id, one, "message", 1, author, time, JsonObject(emptyMap()), null)
    fun summary(title: String, place: String, coffee: Boolean, first: Boolean) = MeetingSummary(
        meeting.id, title, if (coffee) ApiInstant("2026-11-08T09:00:00Z") else meeting.startsAt,
        meeting.timezone, place, null, if (first) 1 else 6, one, RsvpAnswer.Going, one,
        period = MeetingPeriod.Upcoming,
        participantPreview = if (first) {
            listOf(
                author,
            )
        } else {
            listOf(author, friend, UserProfile(id(5), "Саша"))
        },
    )
    val date = DatePoll(
        id(6), meeting.id, author, DatePollSettings(multipleAnswers = false),
        listOf(
            DatePollOption(id(7), "2026-11-07", 2, listOf(author, friend)),
            DatePollOption(id(8), "2026-11-08", 4, listOf(author, friend)),
        ),
        "applied", one, one,
        listOf(
            id(8),
        ),
        time, time, time, listOf(id(8)), id(8), false, false, false,
    )
    fun place(title: String, explanation: String) = PlacePoll(
        id(9), meeting.id, author, title, null,
        "applied", one, one, "for", 4, 1, time, time, time, false, explanation,
    )
    fun task(title: String, accepted: Boolean) = PreparationTask(
        id(if (accepted) 11 else 10), meeting.id, title,
        author, friend, if (accepted) friend else null, author,
        if (accepted) "accepted" else "offered",
        one, time, time, !accepted, false, false, false,
    )
}

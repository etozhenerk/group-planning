import Foundation
import Testing

@testable import Somewhere

@Suite("Meeting action drafts in memory")
@MainActor
struct MeetingActionDraftTests {
    @Test func retainedDatePickerKeepsIdentityWhenOptionsAreRemovedOrCleared() async throws {
        let context = try await FeedTestContext()
        let meeting = try #require(context.owner.meeting)
        let drafts = context.owner.actionDrafts
        let form = drafts.date(meeting: meeting)
        form.dates = ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-24"]
        let displayed = try #require(CalendarDate.parse("2026-11-22"))
        let replacement = try #require(CalendarDate.parse("2026-11-23"))
        let retainedID = form.options[2].id
        let removedID = form.options[1].id
        form.removeDate(form.options[0].id)
        #expect(form.date(for: retainedID, fallback: displayed) == displayed)
        form.setDate(replacement, for: retainedID)
        #expect(form.dates == ["2026-11-21", "2026-11-23", "2026-11-24"])
        form.removeDate(removedID)
        #expect(form.dates.count == 2)
        #expect(form.date(for: removedID, fallback: displayed) == displayed)
        form.setDate(displayed, for: removedID)
        #expect(form.dates == ["2026-11-23", "2026-11-24"])

        drafts.clearDate()
        #expect(form.date(for: retainedID, fallback: displayed) == displayed)
        form.setDate(replacement, for: retainedID)
        form.removeDate(retainedID)
        #expect(form.dates.isEmpty)
        #expect(drafts.date(meeting: meeting) !== form)
    }

    @Test func reopeningKeepsEveryFormUntilSuccessOrMeetingExit() async throws {
        let context = try await FeedTestContext()
        let meeting = try #require(context.owner.meeting)
        let drafts = context.owner.actionDrafts
        let date = drafts.date(meeting: meeting)
        date.dates = ["2026-11-20", "2026-11-22"]
        date.deadline = Date(timeIntervalSince1970: 1_900_000_000)
        date.settings.anonymous = true
        let place = drafts.place(meeting: meeting)
        place.place = "Кафе"
        place.explanation = "Рядом с метро"
        place.deadline = date.deadline
        let preparation = drafts.preparation()
        preparation.title = "Заказать пиццу"
        preparation.recipient = UUID()
        let settings = drafts.settings(meeting: meeting)
        settings.change { $0.title = "Ужин с друзьями" }
        #expect(drafts.date(meeting: meeting) === date)
        #expect(drafts.place(meeting: meeting) === place)
        #expect(drafts.preparation() === preparation)
        #expect(drafts.date(meeting: meeting).dates == ["2026-11-20", "2026-11-22"])
        #expect(drafts.date(meeting: meeting).settings.anonymous)
        #expect(drafts.place(meeting: meeting).deadline == date.deadline)
        #expect(drafts.place(meeting: meeting).explanation == "Рядом с метро")
        #expect(drafts.preparation().recipient == preparation.recipient)
        #expect(drafts.settings(meeting: meeting) === settings)
        #expect(drafts.settings(meeting: meeting).value.title == "Ужин с друзьями")

        drafts.clearDate()
        #expect(date.dates.isEmpty)
        #expect(drafts.date(meeting: meeting) !== date)
        #expect(drafts.place(meeting: meeting).place == "Кафе")
        context.owner.clear()
        #expect(place.place.isEmpty && place.explanation.isEmpty)
        #expect(preparation.title.isEmpty && preparation.recipient == nil)
        #expect(drafts.place(meeting: meeting) !== place)
        #expect(drafts.preparation() !== preparation)
        #expect(drafts.settings(meeting: meeting) !== settings)
        #expect(settings.value.title == meeting.title)
    }

    @Test func failedCreationKeepsRequestAcrossCloseAndReopen() async throws {
        let context = try await FeedTestContext()
        let meeting = try #require(context.owner.meeting)
        let drafts = context.owner.actionDrafts
        let place = drafts.place(meeting: meeting)
        place.place = "Кафе у парка"
        place.explanation = "Рядом с метро"
        let path = context.path + "/place-polls"
        await context.harness.transport.enqueue(path, status: 503)
        #expect(await place.submit() == false)
        let pending = try #require(place.operation.pending)
        let reopened = drafts.place(meeting: meeting)
        #expect(reopened.explanation == "Рядом с метро")
        #expect(reopened.operation.pending?.body == pending.body)
        await context.harness.transport.enqueue(path, status: 503)
        #expect(await reopened.submit() == false)
        let sent = await context.harness.transport.requests.filter { $0.url?.path == path }
        #expect(sent.count == 2)
        #expect(sent.first?.httpBody == sent.last?.httpBody)
        #expect(
            sent.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == sent.last?.value(forHTTPHeaderField: "Idempotency-Key"))
        context.harness.session.updateMeetingAccess(context.id, allowed: false)
        #expect(!reopened.operation.current)
        context.owner.clear()
        #expect(reopened.place.isEmpty && reopened.explanation.isEmpty)
        #expect(reopened.operation.pending == nil)
    }
}

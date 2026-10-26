import Foundation
import Observation

@MainActor @Observable
final class DatePollFormOwner {
    let meeting: Meeting
    let operation: DatePollOwner
    private(set) var options: [DatePollDraftOption] = []
    var dates: [String] {
        get { options.map(\.day) }
        set { options = newValue.map { DatePollDraftOption(day: $0) } }
    }
    var deadline = Date().addingTimeInterval(86_400)
    var repetition: MeetingDraft.Repetition?
    var ambiguous = false
    var settings = DatePollSettings()

    init(meeting: Meeting, session: SessionStore) {
        self.meeting = meeting
        operation = DatePollOwner(meetingID: meeting.id, session: session)
        let first =
            meeting.startsOn
            ?? CalendarDate.today(
                meeting.startsAt?.date ?? Date(),
                zone: TimeZone(identifier: meeting.timezone) ?? .gmt)
        dates = [first, CalendarDate.adding(first, component: .day, value: 1)]
    }

    func date(for id: UUID, fallback: Date) -> Date {
        guard let option = options.first(where: { $0.id == id }) else { return fallback }
        return CalendarDate.parse(option.day) ?? fallback
    }

    func setDate(_ date: Date, for id: UUID) {
        guard operation.editable, let index = options.firstIndex(where: { $0.id == id }) else {
            return
        }
        options[index].day = CalendarDate.string(date)
    }

    func removeDate(_ id: UUID) {
        guard operation.editable, options.count > 2 else { return }
        options.removeAll { $0.id == id }
    }

    func addDate() {
        guard operation.editable, options.count < 20 else { return }
        let day = CalendarDate.adding(
            options.last?.day ?? CalendarDate.today(), component: .day, value: 1)
        options.append(DatePollDraftOption(day: day))
    }

    func submit() async -> Bool {
        if operation.pending != nil {
            await operation.retry()
        } else {
            guard dates.count >= 2, Set(dates).count == dates.count,
                dates.allSatisfy({ CalendarDate.parse($0) != nil })
            else {
                operation.problem = "Предложите хотя бы две разные даты."
                return false
            }
            do {
                let zone = try LocalMeetingTime.zone(meeting.timezone)
                var draft = MeetingDraft(timezone: meeting.timezone)
                draft.day = LocalMeetingTime.day(deadline, zone: zone)
                draft.clock = LocalMeetingTime.clock(deadline, zone: zone)
                draft.repetition = repetition
                let resolved = try LocalMeetingTime.resolve(draft)
                guard resolved > Date() else {
                    operation.problem = "Выберите время окончания позже текущего."
                    return false
                }
                await operation.submit(
                    try DatePollRequests.create(
                        meeting.id, dates: dates,
                        deadline: resolved, settings: settings))
            } catch let issue as DraftIssue {
                ambiguous = issue == .ambiguous
                operation.problem = issue.text
            } catch { operation.problem = "Не удалось подготовить опрос." }
        }
        return operation.current && operation.poll != nil
    }

    func clear() {
        operation.clear()
        dates = []
        deadline = Date()
        repetition = nil
        ambiguous = false
        settings = DatePollSettings()
    }
}

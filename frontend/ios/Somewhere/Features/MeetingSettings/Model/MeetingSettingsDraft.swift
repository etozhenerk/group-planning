import Foundation

enum MeetingSettingsDraft {
    static func make(_ meeting: Meeting) -> MeetingDraft {
        var draft = MeetingDraft(timezone: meeting.timezone)
        draft.title = meeting.title
        draft.description = meeting.description ?? ""
        draft.place = meeting.place ?? ""
        if let date = meeting.startsAt?.date, let zone = TimeZone(identifier: meeting.timezone) {
            draft.day = LocalMeetingTime.day(date, zone: zone)
            draft.clock = LocalMeetingTime.clock(date, zone: zone)
        }
        if draft.day == nil, let day = meeting.startsOn, let date = CalendarDate.parse(day) {
            draft.day = LocalMeetingTime.day(date, zone: .gmt)
        }
        return draft
    }

    static func rebase(_ value: MeetingDraft, from previous: Meeting, to current: Meeting)
        -> MeetingDraft
    {
        let old = make(previous)
        var merged = make(current)
        if value.title != old.title { merged.title = value.title }
        if value.description != old.description { merged.description = value.description }
        if value.place != old.place { merged.place = value.place }
        if value.day != old.day || value.clock != old.clock || value.repetition != nil {
            merged.day = value.day
            merged.clock = value.clock
            merged.repetition = value.repetition
        }
        merged.cover = value.cover
        return merged
    }

    static func patch(_ draft: MeetingDraft, from meeting: Meeting) throws -> UpdateMeeting {
        let original = make(meeting)
        let title = draft.title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...120).contains(title.unicodeScalars.count) else { throw DraftIssue.title }
        guard draft.description.unicodeScalars.count <= 4000 else { throw DraftIssue.description }
        guard draft.place.unicodeScalars.count <= 500 else { throw DraftIssue.place }
        var input = UpdateMeeting(expectedRevision: meeting.revision)
        if title != original.title { input.title = title }
        if draft.description != original.description {
            input.description = draft.description.isEmpty ? .clear : .value(draft.description)
        }
        if draft.place != original.place {
            input.place = draft.place.isEmpty ? .clear : .value(draft.place)
        }
        if draft.day != original.day || draft.clock != original.clock || draft.repetition != nil {
            let date = try draft.input()
            input.startsAt = date.startsAt.map { .value($0) } ?? .clear
            input.startsOn = date.startsOn
        }
        switch draft.cover {
        case .image(let image): input.cover = .value(image)
        case .removed: input.cover = .clear
        case nil: break
        }
        return input
    }
}

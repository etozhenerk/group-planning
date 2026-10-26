import Foundation

@MainActor
final class MeetingActionDrafts {
    private let meetingID: UUID
    private let session: SessionStore
    private var dateForm: DatePollFormOwner?
    private var placeForm: PlacePollFormOwner?
    private var preparationForm: PreparationFormOwner?
    private var settingsForm: MeetingSettingsOwner?

    init(meetingID: UUID, session: SessionStore) {
        self.meetingID = meetingID
        self.session = session
    }

    func date(meeting: Meeting) -> DatePollFormOwner {
        if let dateForm { return dateForm }
        let form = DatePollFormOwner(meeting: meeting, session: session)
        dateForm = form
        return form
    }

    func place(meeting: Meeting) -> PlacePollFormOwner {
        if let placeForm { return placeForm }
        let form = PlacePollFormOwner(meeting: meeting, session: session)
        placeForm = form
        return form
    }

    func preparation() -> PreparationFormOwner {
        if let preparationForm { return preparationForm }
        let form = PreparationFormOwner(meetingID: meetingID, session: session)
        preparationForm = form
        return form
    }

    func settings(meeting: Meeting) -> MeetingSettingsOwner {
        if let settingsForm { return settingsForm }
        let form = MeetingSettingsOwner(meeting: meeting, session: session)
        settingsForm = form
        return form
    }

    func clearSettings() {
        settingsForm?.clear()
        settingsForm = nil
    }

    func clearDate() {
        dateForm?.clear()
        dateForm = nil
    }

    func clearPlace() {
        placeForm?.clear()
        placeForm = nil
    }

    func clearPreparation() {
        preparationForm?.clear()
        preparationForm = nil
    }

    func clear() {
        clearDate()
        clearPlace()
        clearPreparation()
        clearSettings()
    }
}

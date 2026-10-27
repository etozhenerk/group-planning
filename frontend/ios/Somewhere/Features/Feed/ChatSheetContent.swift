import SwiftUI

struct ChatSheetContent: View {
    let owner: FeedOwner

    var body: some View {
        Group {
            switch owner.sheets.last {
            case .information: MeetingInfoScreen(owner: owner)
            case .share: MeetingShareSheet(owner: owner)
            case .settings:
                if let meeting = owner.meeting {
                    MeetingSettingsScreen(
                        owner: owner.actionDrafts.settings(meeting: meeting),
                        completed: owner.actionDrafts.clearSettings)
                }
            case .date:
                if let meeting = owner.meeting {
                    CreateDatePollScreen(
                        form: owner.actionDrafts.date(meeting: meeting),
                        completed: owner.actionDrafts.clearDate)
                }
            case .place:
                if let meeting = owner.meeting {
                    CreatePlacePollScreen(
                        form: owner.actionDrafts.place(meeting: meeting),
                        completed: owner.actionDrafts.clearPlace)
                }
            case .preparation:
                CreatePreparationTaskScreen(
                    form: owner.actionDrafts.preparation(),
                    completed: owner.actionDrafts.clearPreparation)
            case .media: MediaPickerPanel(owner: owner.media, photosOnly: owner.photoSelection)
            case .task(let id):
                if let selected = owner.selectedTask {
                    PreparationTaskDetails(owner: selected, taskID: id)
                }
            case .people(let id): ReactionPeopleScreen(owner: owner, entryID: id)
            case .readers:
                if let readers = owner.readers { ChatReadersSheet(owner: readers) }
            case nil: EmptyView()
            }
        }.environment(
            \.chatSheetClose,
            ChatSheetCloseAction(perform: { owner.closeSheet() }, hasParent: owner.sheets.count > 1)
        )
    }
}

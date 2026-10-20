import SwiftUI

struct CreationSuccessView: View {
    let result: CreatedMeeting
    let close: () -> Void
    let open: () -> Void
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                Image(systemName: "checkmark").font(.title).foregroundStyle(AppPalette.actionText)
                    .frame(width: 64, height: 64).background(
                        AppPalette.accent, in: RoundedRectangle(cornerRadius: 24)
                    ).accessibilityHidden(true)
                Text("Встреча создана").font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
                VStack(alignment: .leading, spacing: 20) {
                    Text(result.meeting.title).font(.title2.bold())
                    MeetingFactsView(meeting: result.meeting)
                }.padding(24).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 24))
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ссылка приглашения").font(.subheadline.bold())
                    Text(result.invitationURL.absoluteString).font(.footnote).textSelection(
                        .enabled
                    ).foregroundStyle(AppPalette.muted)
                }
                ActionButton(title: "Открыть встречу", action: open)
                ActionButton(title: "К моим встречам", primary: false, action: close)
            }.padding(24)
        }.accessibilityIdentifier("meeting-created")
    }
}

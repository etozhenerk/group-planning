import SwiftUI

struct InvitationFactsView: View {
    let value: InvitationPreview
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            Text(value.title).font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
            VStack(alignment: .leading, spacing: 18) {
                Label(
                    MeetingLabels.time(
                        value.startsAt, timezone: value.timezone, startsOn: value.startsOn),
                    systemImage: "calendar")
                Label(value.place ?? "Место пока не выбрано", systemImage: "mappin.and.ellipse")
            }.foregroundStyle(AppPalette.muted)
            if let text = value.description, !text.isEmpty {
                Text(text).font(.body).lineSpacing(4).textSelection(.enabled)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

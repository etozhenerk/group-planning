import SwiftUI

struct UndatedMeetingsButton: View {
    let owner: MeetingListOwner
    var body: some View {
        if let count = owner.counts?.undated, count > 0 {
            Button(action: owner.toggleUndated) {
                HStack {
                    Image(systemName: "calendar.badge.questionmark")
                    Text("Без даты · \(count)")
                }.font(.subheadline).padding(.horizontal, 14).frame(minHeight: 44)
                    .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain).foregroundStyle(AppPalette.muted)
            .accessibilityAddTraits(owner.selection.undated ? .isSelected : [])
            .accessibilityIdentifier("calendar-undated")
        }
    }
}

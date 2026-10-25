import SwiftUI

struct MeetingFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(14).frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 12))
            .textInputAutocapitalization(.sentences)
    }
}

extension View {
    func meetingField() -> some View { modifier(MeetingFieldModifier()) }
}

import SwiftUI

struct ActionFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.designFont(13).padding(.horizontal, 14).padding(.vertical, 13)
            .frame(maxWidth: .infinity, minHeight: 47.5, alignment: .leading)
            .background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.078), lineWidth: 1)
            }
    }
}

extension View {
    func actionField() -> some View { modifier(ActionFieldModifier()) }
}
